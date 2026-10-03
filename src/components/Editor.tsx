"use client";

import { useMemo, useRef, useState } from "react";

export type EditorRatio = "9:16" | "16:9" | "4:5" | "1:1";
interface EditorProps { entered:boolean; ratio:EditorRatio; importedFileName?:string; onClose:()=>void; }
type Tool="move"|"text"|"photo"|"sticker"|"eraser"|"stroke"|"layers";
type Align="left"|"center"|"right";
type TextLayer={id:string;text:string;x:number;y:number;fontFamily:string;fontSize:number;color:string;align:Align;rotation:number;opacity:number};
type PhotoLayer={id:string;src:string;name:string;x:number;y:number;width:number;height:number;rotation:number;opacity:number};
type AssetKind="sticker"|"gif"|"image";
type AssetLayer={id:string;kind:AssetKind;src:string;name:string;x:number;y:number;width:number;height:number;rotation:number;opacity:number};
type AssetGesture={type:"move"|"scale"|"rotate";id:string;startX:number;startY:number;startLayer:AssetLayer;startDistance:number;startAngle:number;anchorX:number;anchorY:number};
type Gesture={type:"move"|"scale"|"rotate";id:string;startX:number;startY:number;startLayer:TextLayer;startDistance:number;startAngle:number;anchorX:number;anchorY:number;startFrame?:{width:number;height:number}};
type PhotoGesture={type:"move"|"scale"|"rotate";id:string;startX:number;startY:number;startLayer:PhotoLayer;startDistance:number;startAngle:number;anchorX:number;anchorY:number};
const TOOLS:Array<{id:Tool;label:string;icon:string}>=[{id:"move",label:"Move",icon:"✦"},{id:"text",label:"Text",icon:"T"},{id:"photo",label:"Photo",icon:"▧"},{id:"sticker",label:"Sticker",icon:"◇"},{id:"eraser",label:"Eraser",icon:"⌁"},{id:"stroke",label:"Stroke",icon:"◌"},{id:"layers",label:"Layers",icon:"≡"}];
const FONTS=["Inter","Arial","Georgia","Times New Roman","Courier New"];
const STICKERS=[
 {id:"spark",name:"Spark",tags:"spark star shine highlight",src:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><path fill='none' stroke='%23111' stroke-width='12' stroke-linecap='round' d='M100 18v48M100 134v48M18 100h48M134 100h48M42 42l34 34M124 124l34 34M158 42l-34 34M76 124l-34 34'/><circle cx='100' cy='100' r='18' fill='%23111'/></svg>")},
 {id:"heart",name:"Heart",tags:"heart love valentine romance",src:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><path fill='%23e44' d='M100 168S28 126 28 75c0-25 17-43 40-43 16 0 26 9 32 20 6-11 16-20 32-20 23 0 40 18 40 43 0 51-72 93-72 93Z'/></svg>")},
 {id:"arrow",name:"Arrow",tags:"arrow direction pointer chevron",src:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 120'><path fill='none' stroke='%23111' stroke-width='18' stroke-linecap='round' stroke-linejoin='round' d='M20 60h182m-56-38 56 38-56 38'/></svg>")},
 {id:"check",name:"Check",tags:"check tick done success",src:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 160'><path fill='none' stroke='%23111' stroke-width='18' stroke-linecap='round' stroke-linejoin='round' d='M25 82 76 132 176 27'/></svg>")},
 {id:"circle",name:"Circle",tags:"circle shape round outline",src:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><circle cx='100' cy='100' r='68' fill='none' stroke='%23111' stroke-width='16'/></svg>")},
 {id:"smile",name:"Smile",tags:"smile happy emoji face",src:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><circle cx='100' cy='100' r='72' fill='none' stroke='%23111' stroke-width='14'/><circle cx='74' cy='82' r='8' fill='%23111'/><circle cx='126' cy='82' r='8' fill='%23111'/><path d='M62 112 Q100 150 138 112' fill='none' stroke='%23111' stroke-width='10' stroke-linecap='round'/></svg>")}
];

export function Editor({entered,ratio,importedFileName,onClose}:EditorProps){
 const [activeTool,setActiveTool]=useState<Tool>("move");
 const [panelOpen,setPanelOpen]=useState(false);
 const [textLayers,setTextLayers]=useState<TextLayer[]>([]);
 const [photoLayers,setPhotoLayers]=useState<PhotoLayer[]>([]);
 const [assetLayers,setAssetLayers]=useState<AssetLayer[]>([]);
 const [assetTab,setAssetTab]=useState<AssetKind>("sticker");
 const [assetSearch,setAssetSearch]=useState("");
 const [selectedTextId,setSelectedTextId]=useState<string|null>(null);
 const [selectedPhotoId,setSelectedPhotoId]=useState<string|null>(null);
 const [selectedAssetId,setSelectedAssetId]=useState<string|null>(null);
 const [fonts,setFonts]=useState(FONTS);
 const [fontStatus,setFontStatus]=useState<string>("");
 const [selectionFrame,setSelectionFrame]=useState<{width:number;height:number}|null>(null);
 const canvasRef=useRef<HTMLDivElement>(null);
 const gestureRef=useRef<Gesture|null>(null);
 const photoGestureRef=useRef<PhotoGesture|null>(null);
 const assetGestureRef=useRef<AssetGesture|null>(null);
 const photoInputRef=useRef<HTMLInputElement>(null);
 const assetInputRef=useRef<HTMLInputElement>(null);
 const textRefs=useRef<Record<string,HTMLDivElement|null>>({});
 const canvasStyle=useMemo(()=>({aspectRatio:({"9:16":"9 / 16","16:9":"16 / 9","4:5":"4 / 5","1:1":"1 / 1"} as Record<EditorRatio,string>)[ratio]}),[ratio]);
 const selectedText=textLayers.find(l=>l.id===selectedTextId)??null;
 const selectedPhoto=photoLayers.find(l=>l.id===selectedPhotoId)??null;
 const selectedAsset=assetLayers.find(l=>l.id===selectedAssetId)??null;
 const filteredStickers=STICKERS.filter(s=>{const q=assetSearch.trim().toLowerCase();return !q||`${s.name} ${s.tags}`.toLowerCase().includes(q);});
 const addText=()=>{const id=`text-${Date.now()}`;setTextLayers(c=>[...c,{id,text:"Double click to edit",x:50,y:50,fontFamily:fonts[0],fontSize:36,color:"#111",align:"center",rotation:0,opacity:1}]);setSelectedTextId(id);setActiveTool("text");setPanelOpen(true);};
 const chooseTool=(tool:Tool)=>{
  setActiveTool(tool);
  if(tool==="text"){
   setSelectedPhotoId(null);
   if(!selectedTextId)addText();else setPanelOpen(true);
  }else if(tool==="photo"){
   setSelectedTextId(null);
   setPanelOpen(true);
   setTimeout(()=>photoInputRef.current?.click(),0);
  }else if(tool==="sticker"){
   setSelectedTextId(null);setSelectedPhotoId(null);
   setPanelOpen(true);
  }else setPanelOpen(tool!=="move");
 };
 const updateSelectedText=(patch:Partial<TextLayer>)=>{if(!selectedTextId)return;setTextLayers(c=>c.map(l=>l.id===selectedTextId?{...l,...patch}:l));};
 const deleteSelectedText=()=>{if(!selectedTextId)return;setTextLayers(c=>c.filter(l=>l.id!==selectedTextId));setSelectedTextId(null);setPanelOpen(false);setSelectionFrame(null);};
 const updateSelectedPhoto=(patch:Partial<PhotoLayer>)=>{if(!selectedPhotoId)return;setPhotoLayers(c=>c.map(l=>l.id===selectedPhotoId?{...l,...patch}:l));};
 const deleteSelectedPhoto=()=>{if(!selectedPhotoId)return;setPhotoLayers(c=>c.filter(l=>l.id!==selectedPhotoId));setSelectedPhotoId(null);setPanelOpen(false);};
 const addOrReplacePhoto=(file:File|undefined)=>{
  if(!file)return;
  const src=URL.createObjectURL(file);
  if(selectedPhotoId){
   setPhotoLayers(c=>c.map(l=>l.id===selectedPhotoId?{...l,src,name:file.name}:l));
   return;
  }
  const id=`photo-${Date.now()}`;
  setPhotoLayers(c=>[...c,{id,src,name:file.name,x:50,y:50,width:58,height:42,rotation:0,opacity:1}]);
  setSelectedPhotoId(id);
  setSelectedTextId(null);
  setActiveTool("photo");
  setPanelOpen(false);
 };
 const addAsset=(kind:AssetKind,src:string,name:string)=>{
  const id=`asset-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  setAssetLayers(cur=>[...cur,{id,kind,src,name,x:50,y:50,width:42,height:30,rotation:0,opacity:1}]);
  setSelectedAssetId(id);setSelectedTextId(null);setSelectedPhotoId(null);setPanelOpen(false);setActiveTool("move");
 };
 const addOrReplaceAsset=(file:File|undefined)=>{
  if(!file)return;
  const isGif=file.type==="image/gif"||file.name.toLowerCase().endsWith(".gif");
  const isImage=file.type.startsWith("image/")&&!isGif;
  if(!isGif&&!isImage)return;
  const src=URL.createObjectURL(file);
  const kind:AssetKind=isGif?"gif":"image";
  const id=`asset-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  setAssetLayers(cur=>[...cur,{id,kind,src,name:file.name,x:50,y:50,width:48,height:34,rotation:0,opacity:1}]);
  setSelectedAssetId(id);setSelectedTextId(null);setSelectedPhotoId(null);setPanelOpen(false);setActiveTool("move");
 };
 const deleteSelectedAsset=(id:string)=>{setAssetLayers(cur=>cur.filter(l=>l.id!==id));setSelectedAssetId(null);};
 const updateSelectedAsset=(id:string,patch:Partial<AssetLayer>)=>setAssetLayers(cur=>cur.map(l=>l.id===id?{...l,...patch}:l));

 const duplicateSelectedPhoto=()=>{
  if(!selectedPhoto)return;
  const id=`photo-${Date.now()}`;
  const copy={...selectedPhoto,id,x:Math.min(92,selectedPhoto.x+5),y:Math.min(92,selectedPhoto.y+5)};
  setPhotoLayers(c=>[...c,copy]);
  setSelectedPhotoId(id);
  setSelectedTextId(null);
 };
 const capture=(e:React.PointerEvent<HTMLElement>)=>{try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}};
 const measureSelectionFrame=(id:string)=>{const element=textRefs.current[id];if(!element)return selectionFrame;const rect=element.getBoundingClientRect();const frame={width:rect.width+12,height:rect.height+12};setSelectionFrame(frame);return frame;};
 const startMove=(e:React.PointerEvent<HTMLElement>,layer:TextLayer)=>{
  if(activeTool!=="move")return;
  e.preventDefault();e.stopPropagation();
  const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect();
  const px=(e.clientX-r.left)/r.width*100;const py=(e.clientY-r.top)/r.height*100;const frame=measureSelectionFrame(layer.id);
  gestureRef.current={type:"move",id:layer.id,startX:px,startY:py,startLayer:layer,startDistance:0,startAngle:0,anchorX:0,anchorY:0,startFrame:frame||undefined};
  setSelectedTextId(layer.id);setActiveTool("move");setPanelOpen(false);capture(e);
 };
 const startScale=(e:React.PointerEvent<HTMLButtonElement>,layer:TextLayer)=>{
  e.preventDefault();e.stopPropagation();const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect();
  const cx=r.left+r.width*layer.x/100;const cy=r.top+r.height*layer.y/100;const frame=measureSelectionFrame(layer.id)||selectionFrame||{width:0,height:0};
  gestureRef.current={type:"scale",id:layer.id,startX:e.clientX,startY:e.clientY,startLayer:layer,startDistance:Math.max(8,Math.hypot(e.clientX-cx,e.clientY-cy)),startAngle:0,anchorX:cx,anchorY:cy,startFrame:frame};
  setSelectedTextId(layer.id);setActiveTool("move");setPanelOpen(false);capture(e);
 };
 const startRotate=(e:React.PointerEvent<HTMLButtonElement>,layer:TextLayer)=>{
  e.preventDefault();e.stopPropagation();const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect();
  const cx=r.left+r.width*layer.x/100;const cy=r.top+r.height*layer.y/100;const frame=measureSelectionFrame(layer.id)||selectionFrame||{width:0,height:0};
  gestureRef.current={type:"rotate",id:layer.id,startX:e.clientX,startY:e.clientY,startLayer:layer,startDistance:0,startAngle:Math.atan2(e.clientY-cy,e.clientX-cx),anchorX:cx,anchorY:cy,startFrame:frame};
  setSelectedTextId(layer.id);setActiveTool("move");setPanelOpen(false);capture(e);
 };
 const moveGesture=(e:React.PointerEvent)=>{
  const g=gestureRef.current,c=canvasRef.current;if(!g||!c)return;e.preventDefault();const r=c.getBoundingClientRect();
  if(g.type==="move"){
   const dx=((e.clientX-r.left)/r.width*100)-g.startX;const dy=((e.clientY-r.top)/r.height*100)-g.startY;
   const x=Math.max(2,Math.min(98,g.startLayer.x+dx));const y=Math.max(2,Math.min(98,g.startLayer.y+dy));
   setTextLayers(cur=>cur.map(l=>l.id===g.id?{...l,x,y,fontSize:g.startLayer.fontSize,rotation:g.startLayer.rotation,align:g.startLayer.align}:l));
   if(g.startFrame)setSelectionFrame(g.startFrame);
  }else if(g.type==="scale"){
   const distanceNow=Math.max(8,Math.hypot(e.clientX-g.anchorX,e.clientY-g.anchorY));const factor=Math.max(.25,Math.min(6,distanceNow/g.startDistance));
   setTextLayers(cur=>cur.map(l=>l.id===g.id?{...l,fontSize:Math.round(Math.max(10,Math.min(240,g.startLayer.fontSize*factor)))}:l));
   if(g.startFrame)setSelectionFrame({width:g.startFrame.width*factor,height:g.startFrame.height*factor});
  }else{
   const currentAngle=Math.atan2(e.clientY-g.anchorY,e.clientX-g.anchorX);let delta=(currentAngle-g.startAngle)*180/Math.PI;if(delta>180)delta-=360;if(delta<-180)delta+=360;
   setTextLayers(cur=>cur.map(l=>l.id===g.id?{...l,rotation:g.startLayer.rotation+delta}:l));if(g.startFrame)setSelectionFrame(g.startFrame);
  }
 };
 const endGesture=(e?:React.PointerEvent<HTMLElement>)=>{if(e&&e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);const g=gestureRef.current;gestureRef.current=null;if(g?.type==="scale")setTimeout(()=>measureSelectionFrame(g.id),0);};

 const startPhotoMove=(e:React.PointerEvent<HTMLElement>,layer:PhotoLayer)=>{
  if(activeTool!=="move"&&activeTool!=="photo")return;
  e.preventDefault();e.stopPropagation();
  const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect();
  const px=(e.clientX-r.left)/r.width*100,py=(e.clientY-r.top)/r.height*100;
  photoGestureRef.current={type:"move",id:layer.id,startX:px,startY:py,startLayer:layer,startDistance:0,startAngle:0,anchorX:0,anchorY:0};
  setSelectedPhotoId(layer.id);setSelectedTextId(null);setActiveTool("photo");setPanelOpen(false);capture(e);
 };
 const startPhotoScale=(e:React.PointerEvent<HTMLButtonElement>,layer:PhotoLayer)=>{
  e.preventDefault();e.stopPropagation();
  const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect();
  const cx=r.left+r.width*layer.x/100,cy=r.top+r.height*layer.y/100;
  photoGestureRef.current={type:"scale",id:layer.id,startX:e.clientX,startY:e.clientY,startLayer:layer,startDistance:Math.max(8,Math.hypot(e.clientX-cx,e.clientY-cy)),startAngle:0,anchorX:cx,anchorY:cy};
  setSelectedPhotoId(layer.id);setSelectedTextId(null);setActiveTool("photo");setPanelOpen(false);capture(e);
 };
 const startPhotoRotate=(e:React.PointerEvent<HTMLButtonElement>,layer:PhotoLayer)=>{
  e.preventDefault();e.stopPropagation();
  const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect();
  const cx=r.left+r.width*layer.x/100,cy=r.top+r.height*layer.y/100;
  photoGestureRef.current={type:"rotate",id:layer.id,startX:e.clientX,startY:e.clientY,startLayer:layer,startDistance:0,startAngle:Math.atan2(e.clientY-cy,e.clientX-cx),anchorX:cx,anchorY:cy};
  setSelectedPhotoId(layer.id);setSelectedTextId(null);setActiveTool("photo");setPanelOpen(false);capture(e);
 };
 const movePhotoGesture=(e:React.PointerEvent)=>{
  const g=photoGestureRef.current,c=canvasRef.current;if(!g||!c)return;
  e.preventDefault();const r=c.getBoundingClientRect();
  if(g.type==="move"){
   const dx=((e.clientX-r.left)/r.width*100)-g.startX,dy=((e.clientY-r.top)/r.height*100)-g.startY;
   const x=Math.max(-20,Math.min(120,g.startLayer.x+dx)),y=Math.max(-20,Math.min(120,g.startLayer.y+dy));
   setPhotoLayers(cur=>cur.map(l=>l.id===g.id?{...l,x,y,width:g.startLayer.width,height:g.startLayer.height,rotation:g.startLayer.rotation}:l));
  }else if(g.type==="scale"){
   const distanceNow=Math.max(8,Math.hypot(e.clientX-g.anchorX,e.clientY-g.anchorY));
   const factor=Math.max(.15,Math.min(5,distanceNow/g.startDistance));
   setPhotoLayers(cur=>cur.map(l=>l.id===g.id?{...l,width:Math.max(8,Math.min(120,g.startLayer.width*factor)),height:Math.max(8,Math.min(120,g.startLayer.height*factor))}:l));
  }else{
   const currentAngle=Math.atan2(e.clientY-g.anchorY,e.clientX-g.anchorX);
   let delta=(currentAngle-g.startAngle)*180/Math.PI;if(delta>180)delta-=360;if(delta<-180)delta+=360;
   setPhotoLayers(cur=>cur.map(l=>l.id===g.id?{...l,rotation:g.startLayer.rotation+delta}:l));
  }
 };
 const endPhotoGesture=(e?:React.PointerEvent<HTMLElement>)=>{
  if(e&&e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  photoGestureRef.current=null;
 };
 const startAssetMove=(e:React.PointerEvent<HTMLElement>,layer:AssetLayer)=>{
  if(activeTool!=="move"&&activeTool!=="sticker")return;
  e.preventDefault();e.stopPropagation();const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect();
  const px=(e.clientX-r.left)/r.width*100,py=(e.clientY-r.top)/r.height*100;
  assetGestureRef.current={type:"move",id:layer.id,startX:px,startY:py,startLayer:layer,startDistance:0,startAngle:0,anchorX:0,anchorY:0};
  setSelectedAssetId(layer.id);setSelectedTextId(null);setSelectedPhotoId(null);setActiveTool("move");setPanelOpen(false);capture(e);
 };
 const startAssetScale=(e:React.PointerEvent<HTMLButtonElement>,layer:AssetLayer)=>{
  e.preventDefault();e.stopPropagation();const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect();
  const cx=r.left+r.width*layer.x/100,cy=r.top+r.height*layer.y/100;
  assetGestureRef.current={type:"scale",id:layer.id,startX:e.clientX,startY:e.clientY,startLayer:layer,startDistance:Math.max(8,Math.hypot(e.clientX-cx,e.clientY-cy)),startAngle:0,anchorX:cx,anchorY:cy};
  setSelectedAssetId(layer.id);setSelectedTextId(null);setSelectedPhotoId(null);setActiveTool("move");setPanelOpen(false);capture(e);
 };
 const startAssetRotate=(e:React.PointerEvent<HTMLButtonElement>,layer:AssetLayer)=>{
  e.preventDefault();e.stopPropagation();const c=canvasRef.current;if(!c)return;const r=c.getBoundingClientRect();
  const cx=r.left+r.width*layer.x/100,cy=r.top+r.height*layer.y/100;
  assetGestureRef.current={type:"rotate",id:layer.id,startX:e.clientX,startY:e.clientY,startLayer:layer,startDistance:0,startAngle:Math.atan2(e.clientY-cy,e.clientX-cx),anchorX:cx,anchorY:cy};
  setSelectedAssetId(layer.id);setSelectedTextId(null);setSelectedPhotoId(null);setActiveTool("move");setPanelOpen(false);capture(e);
 };
 const moveAssetGesture=(e:React.PointerEvent)=>{
  const g=assetGestureRef.current,c=canvasRef.current;if(!g||!c)return;e.preventDefault();const r=c.getBoundingClientRect();
  if(g.type==="move"){
   const dx=((e.clientX-r.left)/r.width*100)-g.startX,dy=((e.clientY-r.top)/r.height*100)-g.startY;
   setAssetLayers(cur=>cur.map(l=>l.id===g.id?{...l,x:Math.max(-20,Math.min(120,g.startLayer.x+dx)),y:Math.max(-20,Math.min(120,g.startLayer.y+dy)),width:g.startLayer.width,height:g.startLayer.height,rotation:g.startLayer.rotation}:l));
  }else if(g.type==="scale"){
   const factor=Math.max(.15,Math.min(5,Math.max(8,Math.hypot(e.clientX-g.anchorX,e.clientY-g.anchorY))/g.startDistance));
   setAssetLayers(cur=>cur.map(l=>l.id===g.id?{...l,width:Math.max(8,Math.min(120,g.startLayer.width*factor)),height:Math.max(8,Math.min(120,g.startLayer.height*factor))}:l));
  }else{
   const current=Math.atan2(e.clientY-g.anchorY,e.clientX-g.anchorX);let delta=(current-g.startAngle)*180/Math.PI;if(delta>180)delta-=360;if(delta<-180)delta+=360;
   setAssetLayers(cur=>cur.map(l=>l.id===g.id?{...l,rotation:g.startLayer.rotation+delta}:l));
  }
 };
 const endAssetGesture=(e?:React.PointerEvent<HTMLElement>)=>{if(e&&e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);assetGestureRef.current=null;};

 const importFont=async(file:File|undefined)=>{
  if(!file)return;
  setFontStatus("");
  const extension=file.name.split(".").pop()?.toLowerCase()||"";
  const supported=["ttf","otf","woff","woff2"];
  if(!supported.includes(extension)){setFontStatus("Use a .ttf, .otf, .woff, or .woff2 font.");return;}
  const cleanName=file.name.replace(/\.[^/.]+$/,"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim();
  const family=(cleanName||`Imported Font ${fonts.length+1}`).slice(0,80);
  const fontUrl=URL.createObjectURL(file);
  try{
   const font=new FontFace(family,`url(${fontUrl})`);
   await font.load();
   document.fonts.add(font);
   setFonts(current=>current.includes(family)?current:[...current,family]);
   updateSelectedText({fontFamily:family});
   setFontStatus(`Installed “${family}” for this design.`);
  }catch{
   URL.revokeObjectURL(fontUrl);
   setFontStatus("That font could not be loaded in this browser.");
  }
 };
 return <main className={`fixed inset-0 z-50 overflow-hidden bg-[#050505] text-white transition-opacity duration-500 ${entered?"opacity-100":"opacity-0"}`} aria-label="Paper Stish editor">
  <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-20 py-20 s:px-30 s:py-25"><button type="button" onClick={onClose} className="group inline-flex items-center gap-10 text-14 text-white/75 hover:text-white"><span className="inline-flex size-32 items-center justify-center rounded-full bg-white/8">×</span><span className="hidden s:inline">MY</span></button><div className="absolute left-1/2 -translate-x-1/2 text-center"><p className="text-16">Paper Stish</p><p className="mt-2 text-11 text-white/40">{importedFileName||ratio}</p></div><button type="button" className="rounded-full bg-white px-18 py-9 text-13 text-black" onClick={()=>window.dispatchEvent(new CustomEvent("paper-stish-export"))}>Export</button></header>
  <div className="absolute inset-0 flex items-center justify-center px-18 pb-100 pt-85"><div className="relative flex h-full w-full items-center justify-center"><div ref={canvasRef} onPointerDown={()=>{if(activeTool==="move"){setSelectedTextId(null);setSelectedPhotoId(null);setSelectedAssetId(null)}}} className="relative max-h-full max-w-full overflow-hidden rounded-[18px] bg-[#f2f0ea] shadow-[0_30px_90px_rgba(0,0,0,.42)]" style={{...canvasStyle,width:"min(76vw, 62rem)"}}>
   {textLayers.length===0&&photoLayers.length===0&&assetLayers.length===0&&<div className="absolute inset-0 flex items-center justify-center text-center text-black/18 pointer-events-none"><p className="text-16">Your design</p></div>}
   <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={e=>{addOrReplacePhoto(e.target.files?.[0]);e.currentTarget.value=""}}/>
   <input ref={assetInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" className="hidden" onChange={e=>{addOrReplaceAsset(e.target.files?.[0]);e.currentTarget.value=""}}/>

   {photoLayers.map(layer=>{
    const selected=layer.id===selectedPhotoId;
    return <div key={layer.id} className="absolute inset-0 pointer-events-none">
     <div
      className="absolute select-none pointer-events-auto"
      onPointerDown={e=>startPhotoMove(e,layer)}
      onPointerMove={movePhotoGesture}
      onPointerUp={endPhotoGesture}
      onPointerCancel={endPhotoGesture}
      onClick={e=>{e.stopPropagation();setSelectedPhotoId(layer.id);setSelectedTextId(null);setActiveTool("photo");setPanelOpen(false);}}
      style={{left:`${layer.x}%`,top:`${layer.y}%`,width:`${layer.width}%`,height:`${layer.height}%`,transform:`translate(-50%,-50%) rotate(${layer.rotation}deg)`,opacity:layer.opacity,touchAction:"none",zIndex:selected?15:5}}
     >
      <img src={layer.src} alt={layer.name} draggable={false} className="block h-full w-full rounded-[10px] object-contain select-none pointer-events-none"/>
     </div>
     {selected&&(activeTool==="photo"||activeTool==="move")&&<div
      className="absolute pointer-events-auto z-30 border-2 border-dashed border-red-500 rounded-[2px]"
      style={{left:`${layer.x}%`,top:`${layer.y}%`,width:`${layer.width}%`,height:`${layer.height}%`,transform:`translate(-50%,-50%) rotate(${layer.rotation}deg)`,transformOrigin:"center center",touchAction:"none"}}
      onPointerDown={e=>startPhotoMove(e,layer)}
      onPointerMove={movePhotoGesture}
      onPointerUp={endPhotoGesture}
      onPointerCancel={endPhotoGesture}
     >
      <span className="pointer-events-none absolute left-1/2 top-[-37px] z-10 h-37 w-px bg-red-500 -translate-x-1/2"/>
      <button aria-label="Rotate photo" type="button" onPointerDown={e=>startPhotoRotate(e,layer)} onPointerMove={movePhotoGesture} onPointerUp={endPhotoGesture} onPointerCancel={endPhotoGesture} className="absolute left-1/2 top-[-54px] z-20 flex size-32 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md touch-none"><span>↻</span></button>
      <button aria-label="Resize photo" type="button" onPointerDown={e=>startPhotoScale(e,layer)} onPointerMove={movePhotoGesture} onPointerUp={endPhotoGesture} onPointerCancel={endPhotoGesture} className="absolute right-[-16px] bottom-[-16px] z-20 flex size-32 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md touch-none"><span>↘</span></button>
     </div>}
   </div>})}

   {assetLayers.map(layer=>{
    const selected=layer.id===selectedAssetId;
    return <div key={layer.id} className="absolute inset-0 pointer-events-none">
     <div className="absolute select-none pointer-events-auto" onPointerDown={e=>startAssetMove(e,layer)} onPointerMove={moveAssetGesture} onPointerUp={endAssetGesture} onPointerCancel={endAssetGesture}
      onClick={e=>{e.stopPropagation();setSelectedAssetId(layer.id);setSelectedTextId(null);setSelectedPhotoId(null);setActiveTool("move");setPanelOpen(false);}}
      style={{left:`${layer.x}%`,top:`${layer.y}%`,width:`${layer.width}%`,height:`${layer.height}%`,transform:`translate(-50%,-50%) rotate(${layer.rotation}deg)`,opacity:layer.opacity,touchAction:"none",zIndex:selected?18:7}}>
      <img src={layer.src} alt={layer.name} draggable={false} className="block h-full w-full rounded-[10px] object-contain select-none pointer-events-none"/>
     </div>
     {selected&&<div className="absolute pointer-events-auto z-30 border-2 border-dashed border-red-500 rounded-[2px]" style={{left:`${layer.x}%`,top:`${layer.y}%`,width:`${layer.width}%`,height:`${layer.height}%`,transform:`translate(-50%,-50%) rotate(${layer.rotation}deg)`,transformOrigin:"center center",touchAction:"none"}} onPointerDown={e=>startAssetMove(e,layer)} onPointerMove={moveAssetGesture} onPointerUp={endAssetGesture} onPointerCancel={endAssetGesture}>
      <span className="pointer-events-none absolute left-1/2 top-[-37px] z-10 h-37 w-px bg-red-500 -translate-x-1/2"/>
      <button aria-label="Rotate asset" type="button" onPointerDown={e=>startAssetRotate(e,layer)} onPointerMove={moveAssetGesture} onPointerUp={endAssetGesture} onPointerCancel={endAssetGesture} className="absolute left-1/2 top-[-54px] z-20 flex size-32 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md touch-none"><span>↻</span></button>
      <button aria-label="Resize asset" type="button" onPointerDown={e=>startAssetScale(e,layer)} onPointerMove={moveAssetGesture} onPointerUp={endAssetGesture} onPointerCancel={endAssetGesture} className="absolute right-[-16px] bottom-[-16px] z-20 flex size-32 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md touch-none"><span>↘</span></button>
     </div>}
    </div>
   })}

   {textLayers.map(layer=>{const selected=layer.id===selectedTextId;const frame=selectionFrame;return <div key={layer.id} className="absolute inset-0 pointer-events-none">
    <div ref={el=>{textRefs.current[layer.id]=el}} role="button" tabIndex={0} onPointerDown={e=>startMove(e,layer)} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} onDoubleClick={e=>{e.stopPropagation();setSelectedTextId(layer.id);setActiveTool("text");setPanelOpen(true)}} onClick={e=>{e.stopPropagation();setSelectedTextId(layer.id);setActiveTool("move");setPanelOpen(false);measureSelectionFrame(layer.id)}} className={`absolute select-none pointer-events-auto px-4 py-2 outline-none ${activeTool==="move"?"cursor-move":"cursor-default"}`} style={{left:`${layer.x}%`,top:`${layer.y}%`,transform:`translate(-50%,-50%) rotate(${layer.rotation}deg)`,fontFamily:layer.fontFamily,fontSize:`${layer.fontSize}px`,color:layer.color,opacity:layer.opacity,textAlign:layer.align,lineHeight:1.08,whiteSpace:"pre",width:"max-content",maxWidth:"none",touchAction:"none",zIndex:selected?20:10}}>
      <span className="relative z-20 block" style={{whiteSpace:"pre",width:"max-content"}} onDoubleClick={e=>{e.stopPropagation();setSelectedTextId(layer.id);setActiveTool("text");setPanelOpen(true)}}>{layer.text}</span>
    </div>
    {selected&&activeTool==="move"&&frame&&<div className="absolute pointer-events-auto z-30" style={{left:`${layer.x}%`,top:`${layer.y}%`,width:`${frame.width}px`,height:`${frame.height}px`,transform:`translate(-50%,-50%) rotate(${layer.rotation}deg)`,transformOrigin:"center center"}}>
      <div className="absolute inset-0 rounded-[2px] border-2 border-dashed border-red-500 pointer-events-auto" onPointerDown={e=>startMove(e,layer)} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} style={{touchAction:"none"}} aria-label="Move selected object"/>
      <span className="pointer-events-none absolute left-1/2 top-[-37px] z-10 h-37 w-px bg-red-500 -translate-x-1/2"/>
      <button aria-label="Rotate text" type="button" onPointerDown={e=>startRotate(e,layer)} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} className="absolute left-1/2 top-[-54px] z-20 flex size-32 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md touch-none"><span>↻</span></button>
      <button aria-label="Resize text" type="button" onPointerDown={e=>startScale(e,layer)} onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} className="absolute right-[-20px] top-1/2 z-20 flex size-32 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-md touch-none"><span>↔</span></button>
    </div>}
   </div>})}
   {importedFileName&&<div className="absolute left-12 top-12 rounded-full bg-black/75 px-10 py-6 text-10 text-white/85">{importedFileName}</div>}
  </div></div></div>
  <div className="absolute bottom-0 left-0 right-0 z-20 px-12 pb-18 s:px-30 s:pb-25"><div className="mx-auto flex max-w-[980px] items-end justify-center gap-6 rounded-[22px] border border-white/10 bg-black/55 p-7 backdrop-blur-xl"><div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto">{TOOLS.map(tool=>{const active=activeTool===tool.id;return <button key={tool.id} type="button" onClick={()=>chooseTool(tool.id)} className={`group flex min-w-[54px] shrink-0 flex-col items-center justify-center gap-4 rounded-[15px] px-8 py-8 transition-all ${active?"bg-white text-black":"text-white/65 hover:bg-white/8 hover:text-white"}`}><span className="flex size-21 items-center justify-center text-15">{tool.icon}</span><span className="text-10">{tool.label}</span></button>})}</div><div className="flex shrink-0 items-center gap-5 border-l border-white/10 pl-7"><button type="button" className="inline-flex size-38 items-center justify-center text-18 text-white/70">↶</button><button type="button" className="inline-flex size-38 items-center justify-center text-18 text-white/70">↷</button></div></div></div>

  {panelOpen&&activeTool==="sticker"&&<div className="absolute bottom-105 left-12 right-12 z-30 mx-auto max-w-[820px]"><div className="rounded-[20px] border border-white/10 bg-[#151515]/95 px-18 py-16 shadow-2xl backdrop-blur-xl">
   <div className="flex items-center justify-between"><div><p className="text-14">Library</p><p className="mt-2 text-11 text-white/40">Choose something to add to your design.</p></div><button type="button" onClick={()=>setPanelOpen(false)} className="size-32 rounded-full bg-white/7">×</button></div>
   <div className="mt-12 flex gap-6 rounded-full bg-white/5 p-1">
    <button type="button" onClick={()=>setAssetTab("sticker")} className={`flex-1 rounded-full px-12 py-8 text-11 ${assetTab==="sticker"?"bg-white text-black":"text-white/55"}`}>Stickers</button>
    <button type="button" onClick={()=>setAssetTab("gif")} className={`flex-1 rounded-full px-12 py-8 text-11 ${assetTab==="gif"?"bg-white text-black":"text-white/55"}`}>GIFs</button>
    <button type="button" onClick={()=>setAssetTab("image")} className={`flex-1 rounded-full px-12 py-8 text-11 ${assetTab==="image"?"bg-white text-black":"text-white/55"}`}>Images</button>
   </div>
   <div className="mt-12"><input value={assetSearch} onChange={e=>setAssetSearch(e.target.value)} placeholder={assetTab==="sticker"?"Search stickers...":assetTab==="gif"?"Search GIFs...":"Search images..."} className="w-full rounded-[12px] border border-white/10 bg-white/6 px-12 py-10 text-12 text-white outline-none"/></div>
   {assetTab==="sticker"&&<div className="mt-12 grid grid-cols-3 gap-8 s:grid-cols-6">{filteredStickers.map(sticker=><button key={sticker.id} type="button" onClick={()=>addAsset("sticker",sticker.src,sticker.name)} className="relative aspect-square overflow-hidden rounded-[14px] bg-[#f0eee8] p-10 text-black hover:scale-[1.02] transition-transform" aria-label={`Add ${sticker.name} sticker`}><img src={sticker.src} alt="" aria-hidden="true" className="h-full w-full object-contain"/></button>)}</div>}
   {assetTab!=="sticker"&&<div className="mt-12 rounded-[15px] border border-white/8 bg-white/4 px-14 py-16 text-center"><p className="text-12 text-white/70">Browse Paper Stish {assetTab==="gif"?"GIFs":"images"} and tap one to add it.</p><p className="mt-5 text-10 text-white/35">Select an item to place it on your canvas.</p></div>}
   {selectedAsset&&<div className="mt-12 flex items-center gap-8 border-t border-white/8 pt-12"><span className="min-w-0 flex-1 truncate text-10 text-white/40">Selected: {selectedAsset.name}</span><label className="text-10 text-white/40">Opacity <input type="range" min="0" max="100" value={Math.round(selectedAsset.opacity*100)} onChange={e=>updateSelectedAsset(selectedAsset.id,{opacity:Number(e.target.value)/100})}/></label><button type="button" onClick={()=>deleteSelectedAsset(selectedAsset.id)} className="rounded-full bg-white/7 px-10 py-7 text-10">Delete</button></div>}
  </div></div>}

  {panelOpen&&activeTool==="photo"&&<div className="absolute bottom-105 left-12 right-12 z-30 mx-auto max-w-[720px]"><div className="rounded-[20px] border border-white/10 bg-[#151515]/95 px-18 py-16 shadow-2xl backdrop-blur-xl">
   <div className="flex items-center justify-between"><div><p className="text-14">Photo</p><p className="mt-2 text-11 text-white/40">{selectedPhoto?"Adjust your selected photo.":"Add a photo to your design."}</p></div><button type="button" onClick={()=>setPanelOpen(false)} className="size-32 rounded-full bg-white/7">×</button></div>
   <div className="mt-14 grid gap-10">
    <button type="button" onClick={()=>photoInputRef.current?.click()} className="rounded-[13px] bg-white px-14 py-11 text-12 text-black">{selectedPhoto?"Replace photo":"Upload photo"}</button>
    {selectedPhoto&&<>
     <label className="grid gap-5 text-10 text-white/45">Opacity <span className="text-white/70">{Math.round(selectedPhoto.opacity*100)}%</span><input type="range" min="0" max="100" value={Math.round(selectedPhoto.opacity*100)} onChange={e=>updateSelectedPhoto({opacity:Number(e.target.value)/100})}/></label>
     <div className="flex flex-wrap gap-7"><button type="button" onClick={duplicateSelectedPhoto} className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/75">Duplicate</button><button type="button" onClick={deleteSelectedPhoto} className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/75">Delete</button></div>
    </>}
   </div>
  </div></div>}

  {panelOpen&&activeTool==="text"&&<div className="absolute bottom-105 left-12 right-12 z-30 mx-auto max-w-[720px]"><div className="rounded-[20px] border border-white/10 bg-[#151515]/95 px-18 py-16 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between"><div><p className="text-14">Text</p><p className="mt-2 text-11 text-white/40">Edit your selected text.</p></div><button type="button" onClick={()=>setPanelOpen(false)} className="size-32 rounded-full bg-white/7">×</button></div><div className="mt-14 grid gap-9"><textarea value={selectedText?.text??""} onChange={e=>updateSelectedText({text:e.target.value})} placeholder="Type something..." rows={2} className="w-full resize-none rounded-[13px] border border-white/10 bg-white/6 px-12 py-10 text-13 text-white outline-none"/><div className="flex flex-wrap gap-7"><button type="button" onClick={addText} className="rounded-full bg-white px-13 py-8 text-11 text-black">+ Add text</button>{selectedText&&<button type="button" onClick={deleteSelectedText} className="rounded-full bg-white/8 px-13 py-8 text-11 text-white/70">Delete</button>}</div><div className="grid gap-9 s:grid-cols-2"><label className="grid gap-5 text-10 text-white/45">Font<select value={selectedText?.fontFamily??fonts[0]} onChange={e=>updateSelectedText({fontFamily:e.target.value})} className="rounded-[11px] border border-white/10 bg-white/6 px-10 py-9 text-12 text-white"><option value="Inter">Inter</option>{fonts.filter(f=>f!=="Inter").map(font=><option key={font} value={font}>{font}</option>)}</select></label><label className="grid gap-5 text-10 text-white/45">Size <span className="text-white/70">{selectedText?.fontSize??36}px</span><input type="range" min="10" max="240" value={selectedText?.fontSize??36} onChange={e=>updateSelectedText({fontSize:Number(e.target.value)})}/></label><label className="grid gap-5 text-10 text-white/45">Opacity <span className="text-white/70">{Math.round((selectedText?.opacity??1)*100)}%</span><input type="range" min="0" max="100" value={Math.round((selectedText?.opacity??1)*100)} onChange={e=>updateSelectedText({opacity:Number(e.target.value)/100})}/></label></div><div className="flex flex-wrap items-center gap-10"><label className="flex items-center gap-7 text-10 text-white/45">Color <input type="color" value={selectedText?.color??"#111"} onChange={e=>updateSelectedText({color:e.target.value})} className="size-28"/></label>{(["left","center","right"] as Align[]).map(align=><button key={align} type="button" onClick={()=>updateSelectedText({align})} className={`rounded-full px-10 py-7 text-10 capitalize ${selectedText?.align===align?"bg-white text-black":"bg-white/7 text-white/60"}`}>{align}</button>)}<label className="cursor-pointer rounded-full bg-white/7 px-12 py-8 text-10 text-white/65">Install Font for This Design<input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={e=>{importFont(e.target.files?.[0]);e.currentTarget.value=""}}/></label></div>{fontStatus&&<p className="text-10 text-white/45">{fontStatus}</p>}</div></div></div>}
 </main>;
}