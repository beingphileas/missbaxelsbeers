import {municipality, type AtlasBrewery, type AtlasLang} from './atlas';

export function atlasPath(lang: AtlasLang, slug?: string) {
 return `${lang === 'en' ? '/en' : ''}/brouwers${slug ? `/${slug}` : ''}`;
}
export function atlasMarkerLabel(b: Pick<AtlasBrewery, 'name' | 'municipality' | 'location'>, lang: AtlasLang, visited: boolean) {
 return [b.name, municipality(b), visited ? (lang === 'nl' ? 'jij was hier' : "you've been here") : ''].filter(Boolean).join(', ');
}