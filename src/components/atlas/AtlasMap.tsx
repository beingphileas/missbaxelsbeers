import {useEffect,useRef} from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import {GestureHandling} from 'leaflet-gesture-handling';
import 'leaflet/dist/leaflet.css';
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import {type AtlasBrewery,type AtlasLang,municipality,stampLabel} from '@/lib/atlas';
import {useStampCard} from '@/hooks/useStampCard';
import './atlas.css';
L.Map.addInitHook('addHandler','gestureHandling',GestureHandling);
const icon=(b:AtlasBrewery,visited:boolean)=>L.divIcon({html:`<span></span>${visited?'<small class="atlas-visit-check" aria-hidden="true">✓</small>':''}`,className:`atlas-pin ${b.missbaxel_status==='nog_niet_geproefd'?'':'tasted'}`,iconSize:[44,44],iconAnchor:[22,22]});
export default function AtlasMap({rows,lang,compact=false}:{rows:AtlasBrewery[];lang:AtlasLang;compact?:boolean}){
 const ref=useRef<HTMLDivElement>(null);const mapRef=useRef<L.Map|null>(null);const group=useRef<L.MarkerClusterGroup|null>(null);const markers=useRef(new Map<string,L.Marker>());const previousVisited=useRef(new Set<string>());const {visited}=useStampCard();const latestVisited=useRef(visited);latestVisited.current=visited;
 useEffect(()=>{
  if(!ref.current)return;
  const options:L.MapOptions & {gestureHandling:boolean;gestureHandlingOptions:{text:{touch:string;scroll:string;scrollMac:string}}}={scrollWheelZoom:false,keyboard:true,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,gestureHandling:true,gestureHandlingOptions:{text:{touch:lang==='nl'?'Gebruik twee vingers om de kaart te verplaatsen':'Use two fingers to move the map',scroll:lang==='nl'?'Gebruik Ctrl en scrollen om in te zoomen':'Use Ctrl + scroll to zoom',scrollMac:lang==='nl'?'Gebruik ⌘ en scrollen om in te zoomen':'Use ⌘ + scroll to zoom'}}};
  const map=L.map(ref.current,options).setView([50.85,4.5],7);mapRef.current=map;
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:19}).addTo(map);
  const cluster=L.markerClusterGroup({animate:false,showCoverageOnHover:false,iconCreateFunction:c=>L.divIcon({html:String(c.getChildCount()),className:'atlas-cluster',iconSize:[44,44]})});group.current=cluster;map.addLayer(cluster);
  const timer=setTimeout(()=>map.invalidateSize(),100);
  return()=>{clearTimeout(timer);markers.current.clear();previousVisited.current.clear();map.remove();mapRef.current=null;group.current=null;};
 },[lang,compact]);
 useEffect(()=>{
  const map=mapRef.current;const cluster=group.current;if(!map||!cluster)return;
  const valid=rows.filter(b=>Number.isFinite(b.lat)&&Number.isFinite(b.lng)&&b.lat>=49.4&&b.lat<=51.6&&b.lng>=2.4&&b.lng<=6.5);
  const ids=new Set(valid.map(b=>b.id));let changed=false;
  for(const [id,marker] of markers.current){if(!ids.has(id)){cluster.removeLayer(marker);markers.current.delete(id);changed=true;}}
  for(const b of valid){
   if(markers.current.has(b.id))continue;
   const popup=document.createElement('div');const name=document.createElement('strong');name.textContent=b.name;const place=document.createElement('p');place.textContent=municipality(b);const status=document.createElement('p');status.textContent=stampLabel(b.missbaxel_status,lang);const link=document.createElement('a');link.href=`/brouwers/${b.slug}`;link.textContent=lang==='nl'?'Bekijk brouwerij':'View brewery';popup.append(name,place,status,link);
   const marker=L.marker([b.lat,b.lng],{keyboard:true,title:`${b.name}, ${municipality(b)}`,alt:b.name,icon:icon(b,latestVisited.current.includes(b.id))}).bindPopup(popup);markers.current.set(b.id,marker);cluster.addLayer(marker);changed=true;
  }
  if(changed&&valid.length)map.fitBounds(valid.map(b=>[b.lat,b.lng] as L.LatLngTuple),{padding:[35,35],maxZoom:compact?13:10});
 },[rows,lang,compact]);
 useEffect(()=>{
  const next=new Set(visited);const before=previousVisited.current;
  for(const b of rows){if(next.has(b.id)!==before.has(b.id))markers.current.get(b.id)?.setIcon(icon(b,next.has(b.id)));}
  previousVisited.current=next;
 },[visited,rows]);
 return <div ref={ref} className={`atlas-map ${compact?'compact':''}`} role="region" aria-label={lang==='nl'?'Kaart van brouwerijen':'Brewery map'} tabIndex={0}/>;
}
