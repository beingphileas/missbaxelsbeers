import {describe,it,expect} from 'vitest';
import {atlasCounts,filterBreweries,readAtlasFilters,stampLabel,breweryKind,type AtlasBrewery} from './atlas';
const b=(overrides:Partial<AtlasBrewery>={}):AtlasBrewery=>({id:'a',name:'Brouwerij Eén',municipality:'Brugge',location:null,province:'West-Vlaanderen',type:'Microbrewery',brewery_category:'microbrewery',atlas_visible:true,visitable:'op afspraak',has_own_installation:true,missbaxel_status:'geproefd',...overrides} as AtlasBrewery);
const empty=readAtlasFilters(new URLSearchParams());
describe('atlas filters',()=>{
 it('excludes breweries not visible in the atlas',()=>expect(filterBreweries([b(),b({atlas_visible:false})],empty)).toHaveLength(1));
 it('searches name and municipality without case or accents',()=>{expect(filterBreweries([b()],{...empty,q:'een'})).toHaveLength(1);expect(filterBreweries([b()],{...empty,q:'BRUGGE'})).toHaveLength(1);expect(filterBreweries([b()],{...empty,q:'Gent'})).toHaveLength(0);});
 it('filters the selected province',()=>expect(filterBreweries([b(),b({province:'Limburg'})],{...empty,province:'Limburg'})[0].province).toBe('Limburg'));
 it('filters type using the existing contract classification',()=>expect(filterBreweries([b(),b({type:'Contract brewer'})],{...empty,kind:'bierfirma'})).toHaveLength(1));
 it('visitable includes yes and appointment but excludes no and unknown',()=>expect(filterBreweries(['ja','op afspraak','nee','onbekend',null].map(visitable=>b({visitable})),{...empty,visitable:true})).toHaveLength(2));
 it('own installation requires true, not null',()=>expect(filterBreweries([b(),b({has_own_installation:null}),b({has_own_installation:false})],{...empty,own:true})).toHaveLength(1));
 it('selects the exact MissBaxel status',()=>expect(filterBreweries([b(),b({missbaxel_status:'samen_gebrouwen'})],{...empty,status:'samen_gebrouwen'})).toHaveLength(1));
 it('restores every filter from a shared URL',()=>expect(readAtlasFilters(new URLSearchParams('q=Brugge&provincie=Limburg&soort=steker&bezoek=ja&installatie=ja&status=aan_de_toog'))).toEqual({q:'Brugge',province:'Limburg',kind:'steker',visitable:true,own:true,status:'aan_de_toog'}));
 it('counts visible breweries, known provinces and every tasted status',()=>expect(atlasCounts([b(),b({province:'Limburg',missbaxel_status:'aan_de_toog'}),b({missbaxel_status:'nog_niet_geproefd'}),b({atlas_visible:false,province:'Antwerpen'})])).toEqual({breweries:3,provinces:2,tasted:2}));
 it('supports all five kinds without rewriting stored type',()=>{expect(breweryKind(b({brewery_category:'brewpub'}))).toBe('brewpub');expect(breweryKind(b({brewery_category:'hoevebrouwerij'}))).toBe('hoevebrouwerij');expect(breweryKind(b({type:'Blender/Stekerij'}))).toBe('steker');});
});
describe('atlas stamps',()=>{
 it.each([['samen_gebrouwen','Samen gebrouwen','Brewed together'],['aan_de_toog','Aan de toog geweest','Met at the bar'],['geproefd','Geproefd door MissBaxel','Tasted by MissBaxel'],['nog_niet_geproefd','Nog niet geproefd door MissBaxel','Not tasted by MissBaxel yet']])('%s uses the requested label', (key,nl,en)=>{expect(stampLabel(key)).toBe(nl);expect(stampLabel(key,'en')).toBe(en);});
});
