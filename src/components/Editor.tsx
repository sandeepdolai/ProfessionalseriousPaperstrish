"use client";

import { useMemo, useRef, useState } from "react";

export type EditorRatio = "9:16" | "16:9" | "4:5" | "1:1";
interface EditorProps { entered:boolean; ratio:EditorRatio; importedFileName?:string; onClose:()=>void; }
type Tool="move"|"text"|"photo"|"sticker"|"eraser"|"stroke"|"layers";
type Align="left"|"center"|"right";
type TextLayer={id:string;text:string;x:number;y:number;fontFamily:string;fontSize:number;color:string;align:Align;rotation:number};
type Gesture={type:"move"|"scale"|"rotate";id:string;startX:number;startY:number;startLayer:TextLayer;startDistance:number;startAngle:number;anchorX:number;anchorY:number};
type CanvasTransform={scale:number;panX:number;panY:number;rotation:number};
type CanvasPointer={x:number;y:number};
type CanvasGesture={mode:"pan"|"transform";startA:CanvasPointer;startB?:CanvasPointer;startCenter:CanvasPointer;startDistance:number;startAngle:number;startTransform:CanvasTransform};
const TOOLS:Array<{id:Tool;label:string;icon:string}>=[{id:"move",label:"Move",icon:"✦"},{id:"text",label:"Text",icon:"T"},{id:"photo",label:"Photo",icon:"▧"},{id:"sticker",label:"Sticker",icon:"◇"},{id:"eraser",label:"Eraser",icon:"⌁"},{id:"stroke",label:"Stroke",icon:"◌"},{id:"layers",label:"Layers",icon:"≡"}];
const FONTS=["Inter","Arial","Georgia","Times New Roman","Courier New"];

const distance=(a:CanvasPointer,b:CanvasPointer)=>Math.hypot(b.x-a.x,b.y-a.y);
const angle=(a:CanvasPointer,b:CanvasPointer)=>Math.atan2(b.y-a.y,b.x-a.x);
const center=(a:CanvasPointer,b:CanvasPointer)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const rotateVector=(x:number,y:number,radians:number)=>({x:x*Math.cos(radians)-y*Math.sin(radians),y:x*Math.sin(radians)+y*Math.cos(radians)});
const normalizeAngle=(radians:number)=>{let a=radians;if(a>Math.PI)a-=Math.PI*2;if(a<-Math.PI)a+=Math.PI*2;return a;};

export function Editor({entered,ratio,importedFileName,onClose}:EditorProps){
 const [activeTool,setActiveTool]=useState<Tool>("move");
 const [panelOpen,setPanelOpen]=useState(false);
 const [textLayers,setTextLayers]=useState<TextLayer[]>([]);
 const [selectedTextId,setSelectedTextId]=useState<string|null>(null);
 const [fonts,setFonts]=useState(FONTS);
 const [selectionBoxSize,setSelectionBoxSize]=useState<{width:number;height:number}|null>(null);
 const [canvasTransform,setCanvasTransform]=useState<CanvasTransform>({scale:1,panX:0,panY:0,rotation:0});
 const canvasRef=useRef<HTMLDivElement>(null);
 const stageRef=useRef<HTMLDivElement>(null);
 const gestureRef=useRef<Gesture|null>(null);
 const canvasPointersRef=useRef<Map<number,CanvasPointer>>(new Map());
 const canvasGestureRef=useRef<CanvasGesture|null>(null);
 const canvasTransformRef=useRef<CanvasTransform>(canvasTransform);
 const canvasStyle=useMemo(()=>({aspectRatio:({"9:16":"9 / 16","16:9":"16 / 9","4:5":"4 / 5","1:1":"1 / 1"} as Record<EditorRatio,string>)[ratio]}),[ratio]);
 const selectedText=textLayers.find(l=>l.id===selectedTextId)??null;

 const setCanvasView=(next:CanvasTransform)=>{
  canvasTransformRef.current=next;
  setCanvasTransform(next);
 };

 const getStageCenter=()=>{
  const stage=stageRef.current;
  if(!stage)return{x:0,y:0};
  const r=stage.getBoundingClientRect();
  return{x:r.left+r.width/2,y:r.top+r.height/2};
 };

 const getCanvasSize=()=>{
  const canvas=canvasRef.current;
  if(!canvas)return{width:1,height:1};
  return{width:canvas.offsetWidth||1,height:canvas.offsetHeight||1};
 };

 const canvasPointToScreen=(x:number,y:number)=>{
  const {width,height}=getCanvasSize();
  const base={x:(x/100-.5)*width,y:(y/100-.5)*height};
  const t=canvasTransformRef.current;
  const rotated=rotateVector(base.x*t.scale,base.y*t.scale,t.rotation);
  const stageCenter=getStageCenter();
  return{x:stageCenter.x+t.panX+rotated.x,y:stageCenter.y+t.panY+rotated.y};
 };

 const screenToCanvasPercent=(clientX:number,clientY:number)=>{
  const {width,height}=getCanvasSize();
  const t=canvasTransformRef.current;
  const stageCenter=getStageCenter();
  const relative=rotateVector(clientX-stageCenter.x-t.panX,clientY-stageCenter.y-t.panY,-t.rotation);
  const localX=width/2+relative.x/Math.max(.01,t.scale);
  const localY=height/2+relative.y/Math.max(.01,t.scale);
  return{x:localX/width*100,y:localY/height*100};
 };

 const addText=()=>{const id=\`text-\${Date.now()}\`;setTextLayers(c=>[...c,{id,text:"Double click to edit",x:50,y:50,fontFamily:fonts[0],fontSize:36,color:"#111",align:"center",rotation:0}]);setSelectedTextId(id);setActiveTool("text");setPanelOpen(true);};
 const chooseTool=(tool:Tool)=>{setActiveTool(tool);if(tool==="text"){if(!selectedTextId)addText();else setPanelOpen(true);}else setPanelOpen(tool!=="move");};
 const updateSelectedText=(patch:Partial<TextLayer>)=>{if(!selectedTextId)return;setTextLayers(c=>c.map(l=>l.id===selectedTextId?{...l,...patch}:l));};
 const deleteSelectedText=()=>{if(!selectedTextId)return;setTextLayers(c=>c.filter(l=>l.id!==selectedTextId));setSelectedTextId(null);setPanelOpen(false);};
 const capture=(e:React.PointerEvent<HTMLElement>)=>{try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}};
 const lockSelectionBox=(element:HTMLElement)=>{const rect=element.getBoundingClientRect();const sx=Math.max(.01,canvasTransformRef.current.scale);setSelectionBoxSize({width:rect.width/sx,height:rect.height/sx});};

 const startMove=(e:React.PointerEvent<HTMLElement>,layer:TextLayer)=>{
  if(activeTool!=="move")return;
  e.preventDefault();
  e.stopPropagation();
  const p=screenToCanvasPercent(e.clientX,e.clientY);
  lockSelectionBox(e.currentTarget);
  gestureRef.current={type:"move",id:layer.id,startX:p.x,startY:p.y,startLayer:layer,startDistance:0,startAngle:0,anchorX:0,anchorY:0};
  setSelectedTextId(layer.id);
  setActiveTool("move");
  setPanelOpen(false);
  capture(e);
 };

 const startScale=(e:React.PointerEvent<HTMLButtonElement>,layer:TextLayer)=>{
  e.preventDefault();e.stopPropagation();
  const anchor=canvasPointToScreen(layer.x,layer.y);
  gestureRef.current={type:"scale",id:layer.id,startX:e.clientX,startY:e.clientY,startLayer:layer,startDistance:Math.max(8,Math.hypot(e.clientX-anchor.x,e.clientY-anchor.y)),startAngle:0,anchorX:anchor.x,anchorY:anchor.y};
  setSelectedTextId(layer.id);setActiveTool("move");setPanelOpen(false);capture(e);
 };

 const startRotate=(e:React.PointerEvent<HTMLButtonElement>,layer:TextLayer)=>{
  e.preventDefault();e.stopPropagation();
  const anchor=canvasPointToScreen(layer.x,layer.y);
  gestureRef.current={type:"rotate",id:layer.id,startX:e.clientX,startY:e.clientY,startLayer:layer,startDistance:0,startAngle:Math.atan2(e.clientY-anchor.y,e.clientX-anchor.x),anchorX:anchor.x,anchorY:anchor.y};
  setSelectedTextId(layer.id);setActiveTool("move");setPanelOpen(false);capture(e);
 };

 const moveGesture=(e:React.PointerEvent)=>{
  const g=gestureRef.current;
  if(!g)return;
  if(g.type==="move"){
   const p=screenToCanvasPercent(e.clientX,e.clientY);
   const dx=p.x-g.startX,dy=p.y-g.startY;
   const x=Math.max(-20,Math.min(120,g.startLayer.x+dx));
   const y=Math.max(-20,Math.min(120,g.startLayer.y+dy));
   setTextLayers(cur=>cur.map(l=>l.id===g.id?{...l,x,y,fontSize:g.startLayer.fontSize}:l));
  }else if(g.type==="scale"){
   const distanceNow=Math.max(8,Math.hypot(e.clientX-g.anchorX,e.clientY-g.anchorY));
   const factor=Math.max(.25,Math.min(6,distanceNow/g.startDistance));
   setTextLayers(cur=>cur.map(l=>l.id===g.id?{...l,fontSize:Math.round(Math.max(10,Math.min(240,g.startLayer.fontSize*factor)))}:l));
  }else{
   const currentAngle=Math.atan2(e.clientY-g.anchorY,e.clientX-g.anchorX);
   const delta=normalizeAngle(currentAngle-g.startAngle)*180/Math.PI;
   setTextLayers(cur=>cur.map(l=>l.id===g.id?{...l,rotation:g.startLayer.rotation+delta}:l));
  }
 };

 const endGesture=(e?:React.PointerEvent<HTMLElement>)=>{
  if(e&&e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  const g=gestureRef.current;
  gestureRef.current=null;
  if(g?.type==="scale")setSelectionBoxSize(null);
 };

 const startCanvasGesture=()=>{
  const pointers=canvasPointersRef.current;
  if(pointers.size===1){
   const [a]=Array.from(pointers.values());
   if(!a)return;
   canvasGestureRef.current={
    mode:"pan",
    startA:{...a},
    startCenter:{...a},
    startDistance:0,
    startAngle:0,
    startTransform:{...canvasTransformRef.current}
   };
   return;
  }
  if(pointers.size!==2)return;
  const [a,b]=Array.from(pointers.values());
  if(!a||!b)return;
  canvasGestureRef.current={
   mode:"transform",
   startA:{...a},
   startB:{...b},
   startCenter:center(a,b),
   startDistance:Math.max(1,distance(a,b)),
   startAngle:angle(a,b),
   startTransform:{...canvasTransformRef.current}
  };
 };

 const startCanvasPointer=(e:React.PointerEvent<HTMLDivElement>)=>{
  if(activeTool!=="move")return;
  e.preventDefault();
  canvasPointersRef.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}
  startCanvasGesture();
 };

 const moveCanvasPointer=(e:React.PointerEvent<HTMLDivElement>)=>{
  const pointers=canvasPointersRef.current;
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const g=canvasGestureRef.current;
  if(!g)return;
  e.preventDefault();

  if(g.mode==="pan" && pointers.size===1){
   const p=pointers.get(e.pointerId);
   if(!p)return;
   const nextPanX=g.startTransform.panX+(p.x-g.startA.x);
   const nextPanY=g.startTransform.panY+(p.y-g.startA.y);
   setCanvasView({...g.startTransform,panX:nextPanX,panY:nextPanY});
   return;
  }

  if(pointers.size!==2)return;
  if(g.mode!=="transform")startCanvasGesture();
  const activeGesture=canvasGestureRef.current;
  if(!activeGesture||activeGesture.mode!=="transform")return;

  const values=Array.from(pointers.values());
  const a=values[0],b=values[1];
  if(!a||!b)return;
  const currentCenter=center(a,b);
  const currentDistance=Math.max(1,distance(a,b));
  const currentAngle=angle(a,b);
  const factor=currentDistance/activeGesture.startDistance;
  const nextScale=Math.max(.5,Math.min(4,activeGesture.startTransform.scale*factor));
  const nextRotation=activeGesture.startTransform.rotation+normalizeAngle(currentAngle-activeGesture.startAngle);
  const stageCenter=getStageCenter();
  const startCenterVector={x:activeGesture.startCenter.x-stageCenter.x-activeGesture.startTransform.panX,y:activeGesture.startCenter.y-stageCenter.y-activeGesture.startTransform.panY};
  const source=rotateVector(startCenterVector,-activeGesture.startTransform.rotation);
  const sourceScaled=rotateVector(source.x*(nextScale/activeGesture.startTransform.scale),source.y*(nextScale/activeGesture.startTransform.scale),nextRotation);
  const nextPanX=currentCenter.x-stageCenter.x-sourceScaled.x;
  const nextPanY=currentCenter.y-stageCenter.y-sourceScaled.y;
  setCanvasView({scale:nextScale,panX:nextPanX,panY:nextPanY,rotation:nextRotation});
 };

 const endCanvasPointer=(e:React.PointerEvent<HTMLDivElement>)=>{
  canvasPointersRef.current.delete(e.pointerId);
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  if(canvasPointersRef.current.size===0)canvasGestureRef.current=null;
  else if(canvasPointersRef.current.size===1){
   canvasGestureRef.current=null;
   startCanvasGesture();
  }
 };

 const importFont=async(file:File|undefined)=>{
  if(!file)return;
  const family=file.name.replace(/\.[^\/.]+$/,"")||\`Imported Font \${fonts.length+1}\`;
  try{const font=new FontFace(family,\`url(\${URL.createObjectURL(file)})\`);await font.load();document.fonts.add(font);setFonts(c=>c.includes(family)?c:[...c,family]);updateSelectedText({fontFamily:family});}catch{}
 };

 return <main className={\`fixed inset-0 z-50 overflow-hidden bg-[#050505] text-white transition-opacity duration-500 \${entered?"opacity-100":"opacity-0"}\`} aria-label="Paper Stish editor">
  <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-20 py-20 s:px-30 s:py-25"><button type="button" onClick={onClose} className="group inline-flex items-center gap-10 text-14 text-white/75 hover:text-white"><span className="inline-flex size-32 items-center justify-center rounded-full bg-white/8">×</span><span className="hidden s:inline">MY</span></button><div className="absolute left-1/2 -translate-x-1/2 text-center"><p className="text-16">Paper Stish</p><p className="mt-2 text-11 text-white/40">{importedFileName||ratio}</p></div><div className="flex items-center gap-8"><button type="button" className="rounded-full bg-white px-18 py-9 text-13 text-black" onClick={()=>window.dispatchEvent(new CustomEvent("paper-stish-export"))}>Export</button></div></header>

  <div ref={stageRef} className="absolute inset-0 flex items-center justify-center px-18 pb-100 pt-85 touch-none" onPointerDown={startCanvasPointer} onPointerMove={moveCanvasPointer} onPointerUp={endCanvasPointer} onPointerCancel={endCanvasPointer}>
   <div className="relative flex h-full w-full items-center justify-center">
    <div ref={canvasRef} className="relative max-h-full max-w-full overflow-hidden rounded-[18px] bg-[#f2f0ea] shadow-[0_30px_90px_rgba(0,0,0,.42)] touch-none" style={{...canvasStyle,width:"min(76vw, 62rem)",transformOrigin:"center center",transform:\`translate3d(\${canvasTransform.panX}px,\${canvasTransform.panY}px,0) scale(\${canvasTransform.scale}) rotate(\${canvasTransform.rotation}rad)\`}}>
     {textLayers.length===0&&<div className="absolute inset-0 flex items-center justify-center text-center text-black/18 pointer-events-none"><p className="text-16">Your design</p></div>}

     {textLayers.map(layer=>{
      const selected=layer.id===selectedTextId;
      return <div key={layer.id} role="button" tabIndex={0}
       onPointerDown={e=>startMove(e,layer)}
       onPointerMove={moveGesture}
       onPointerUp={endGesture}
       onPointerCancel={endGesture}
      
       onClick={e=>{setSelectedTextId(layer.id);setActiveTool("move");setPanelOpen(false);lockSelectionBox(e.currentTarget);}}
       className={\`absolute select-none px-4 py-2 outline-none \${activeTool==="move"?"cursor-move":"cursor-default"}\`}
       style={{left:\`\${layer.x}%\`,top:\`\${layer.y}%\`,transform:\`translate(-50%,-50%) rotate(\${layer.rotation}deg)\`,fontFamily:layer.fontFamily,fontSize:\`\${layer.fontSize}px\`,color:layer.color,textAlign:layer.align,lineHeight:1.08,whiteSpace:"pre",width:"max-content",maxWidth:"none",wordBreak:"normal",overflow:"visible",transformOrigin:"center center",touchAction:"none",willChange:"transform",userSelect:"none"}}>
       {selected&&activeTool==="move"&&<div
         className="pointer-events-none absolute z-0 rounded-[2px] border-2 border-dashed border-red-500"
         style={selectionBoxSize?{width:selectionBoxSize.width,height:selectionBoxSize.height,left:"50%",top:"50%",transform:"translate(-50%,-50%)"}:{left:"-6px",right:"-6px",top:"-6px",bottom:"-6px"}}
         aria-hidden="true"
       />}
       <span className="relative z-10 block" onDoubleClick={e=>{e.stopPropagation();setSelectedTextId(layer.id);setActiveTool("text");setPanelOpen(true);}}>{layer.text}</span>
       {selected&&activeTool==="move"&&<>
        <span className="pointer-events-none absolute left-1/2 top-[-43px] z-10 h-37 w-px bg-red-500"/>
        <button aria-label="Rotate text" type="button" onPointerDown={e=>startRotate(e,layer)} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} className="absolute left-1/2 top-[-58px] z-20 flex size-32 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md"><span>↻</span></button>
        <button aria-label="Resize text" type="button" onPointerDown={e=>startScale(e,layer)} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} className="absolute right-[-29px] top-1/2 z-20 flex size-32 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md"><span>↔</span></button>
       </>}
      </div>;
     })}

     {importedFileName&&<div className="pointer-events-none absolute left-12 top-12 rounded-full bg-black/75 px-10 py-6 text-10 text-white/85">{importedFileName}</div>}
    </div>
   </div>
  </div>

  <div className="absolute bottom-0 left-0 right-0 z-20 px-12 pb-18 s:px-30 s:pb-25"><div className="mx-auto flex max-w-[980px] items-end justify-center gap-6 rounded-[22px] border border-white/10 bg-black/55 p-7 backdrop-blur-xl"><div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto">{TOOLS.map(tool=>{const active=activeTool===tool.id;return <button key={tool.id} type="button" onClick={()=>chooseTool(tool.id)} className={\`group flex min-w-[54px] shrink-0 flex-col items-center justify-center gap-4 rounded-[15px] px-8 py-8 transition-all \${active?"bg-white text-black":"text-white/65 hover:bg-white/8 hover:text-white"}\`}><span className="flex size-21 items-center justify-center text-15">{tool.icon}</span><span className="text-10">{tool.label}</span></button>;})}</div><div className="flex shrink-0 items-center gap-5 border-l border-white/10 pl-7"><button type="button" className="inline-flex size-38 items-center justify-center text-18 text-white/70">↶</button><button type="button" className="inline-flex size-38 items-center justify-center text-18 text-white/70">↷</button></div></div></div>

  {panelOpen&&activeTool==="text"&&<div className="absolute bottom-105 left-12 right-12 z-30 mx-auto max-w-[720px]"><div className="rounded-[20px] border border-white/10 bg-[#151515]/95 px-18 py-16 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between"><div><p className="text-14">Text</p><p className="mt-2 text-11 text-white/40">Edit your selected text.</p></div><button type="button" onClick={()=>setPanelOpen(false)} className="size-32 rounded-full bg-white/7">×</button></div><div className="mt-14 grid gap-9"><textarea value={selectedText?.text??""} onChange={e=>updateSelectedText({text:e.target.value})} placeholder="Type something..." rows={2} className="w-full resize-none rounded-[13px] border border-white/10 bg-white/6 px-12 py-10 text-13 text-white outline-none"/><div className="flex flex-wrap gap-7"><button type="button" onClick={addText} className="rounded-full bg-white px-13 py-8 text-11 text-black">+ Add text</button>{selectedText&&<button type="button" onClick={deleteSelectedText} className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/70">Delete</button>}</div><div className="grid gap-9 s:grid-cols-2"><label className="grid gap-5 text-10 text-white/45">Font<select value={selectedText?.fontFamily??fonts[0]} onChange={e=>updateSelectedText({fontFamily:e.target.value})} className="rounded-[11px] border border-white/10 bg-white/6 px-10 py-9 text-12 text-white"><option value="Inter">Inter</option>{fonts.filter(f=>f!=="Inter").map(font=><option key={font} value={font}>{font}</option>)}</select></label><label className="grid gap-5 text-10 text-white/45">Size <span className="text-white/70">{selectedText?.fontSize??36}px</span><input type="range" min="10" max="240" value={selectedText?.fontSize??36} onChange={e=>updateSelectedText({fontSize:Number(e.target.value)})}/></label></div><div className="flex flex-wrap items-center gap-10"><label className="flex items-center gap-7 text-10 text-white/45">Color <input type="color" value={selectedText?.color??"#111"} onChange={e=>updateSelectedText({color:e.target.value})} className="size-28"/></label>{(["left","center","right"] as Align[]).map(align=><button key={align} type="button" onClick={()=>updateSelectedText({align})} className={\`rounded-full px-10 py-7 text-10 capitalize \${selectedText?.align===align?"bg-white text-black":"bg-white/7 text-white/60"}\`}>{align}</button>)}<label className="cursor-pointer rounded-full bg-white/7 px-12 py-8 text-10 text-white/65">Import font<input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={e=>importFont(e.target.files?.[0])}/></label></div></div></div></div>}
 </main>;
}
