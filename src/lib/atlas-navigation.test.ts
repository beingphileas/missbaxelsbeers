import {describe,it,expect} from 'vitest';
import {atlasPath,atlasMarkerLabel} from './atlas-navigation';
describe('atlas navigation and marker access',()=>{
 it('retains the active NL or EN route for atlas and detail links',()=>{
  expect(atlasPath('nl')).toBe('/brouwers');expect(atlasPath('en')).toBe('/en/brouwers');
  expect(atlasPath('nl','keun')).toBe('/brouwers/keun');expect(atlasPath('en','keun')).toBe('/en/brouwers/keun');
 });
 it('includes the personal visit in marker text only for visited breweries',()=>{
  const b={name:'KEUN',municipality:'Ronse',location:null};
  expect(atlasMarkerLabel(b,'nl',true)).toBe('KEUN, Ronse, jij was hier');
  expect(atlasMarkerLabel(b,'en',true)).toBe("KEUN, Ronse, you've been here");
  expect(atlasMarkerLabel(b,'en',false)).toBe('KEUN, Ronse');
 });
});