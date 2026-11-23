import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import { type AtlasBrewery, type AtlasLang, municipality, stampLabel } from '@/lib/atlas';
import './atlas.css';
import {useStampCard} from '@/hooks/useStampCard';
export default function AtlasMap({rows,lang,compact=false}:{rows:AtlasBrewery[];lang:AtlasLang;compact?:boolean}) {
 const ref=useRef<HTMLDivElement>(null);
 const {visited}=useStampCard();
 useEffect(()=>{
  if (!ref.current) return;
  const map=L.map(ref.current,{scrollWheelZoom:false,keyboard:true,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView([50.85,4.5],7);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:19}).addTo(map);
  const cluster=L.markerClusterGroup({animate:false,showCoverageOnHover:false,iconCreateFunction:c=>L.divIcon({html:String(c.getChildCount()),className:'atlas-cluster',iconSize:[36,36]})});
  const bounds:L.LatLngTuple[]=[];
  for (const b of rows) {
   if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng) || b.lat <49.4 || b.lat>51.6 || b.lng<2.4 || b.lng>6.5) continue;
   bounds.push([b.lat,b.lng]);
   const popup=document.createElement('div');
   const name=document.createElement('strong'); name.textContent=b.name;
   const place=document.createElement('p'); place.textContent=municipality(b);
   const status=document.createElement('p'); status.textContent=stampLabel(b.missbaxel_status,lang);
   const link=document.createElement('a'); link.href=`/brouwers/${b.slug}`;link.textContent=lang==='nl'?'Bekijk brouwerij':'View brewery';
   popup.append(name,place,status,link);
   const marker=L.marker([b.lat,b.lng],{keyboard:true,title:`${b.name}, ${municipality(b)}`,alt:`${b.name}${visited.includes(b.id)?(lang==='nl'?', ik was hier':", I have been here"):''}`,icon:L.divIcon({html:`<span></span>${visited.includes(b.id)?'<small class="atlas-visit-check" aria-hidden="true">✓</small>':''}`,className:`atlas-pin ${b.missbaxel_status==='nog_niet_geproefd'?'':'tasted'}`,iconSize:[20,20],iconAnchor:[10,10]})}).bindPopup(popup);
   cluster.addLayer(marker);
  }
  map.addLayer(cluster);
  if (bounds.length) map.fitBounds(bounds,{padding:[35,35],maxZoom:compact?13:10});
  const timer=setTimeout(()=>map.invalidateSize(),100);
  return ()=>{clearTimeout(timer);map.stop();map.closePopup();cluster.clearLayers();map.remove();};
 },[rows,lang,compact,visited]);
 return <div ref={ref} className={`atlas-map ${compact?'compact':''}`} role="region" aria-label={lang==='nl'?'Kaart van brouwerijen':'Brewery map'} tabIndex={0}/>;
}
