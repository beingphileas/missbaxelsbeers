import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
function luminance([r,g,b]:number[]){const values=[r,g,b].map(c=>{c/=255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;});return values[0]*0.2126+values[1]*0.7152+values[2]*0.0722;}
function rgb(h:number,s:number,l:number){s/=100;l/=100;const a=s*Math.min(l,1-l);return [0,8,4].map(n=>{const k=(n+h/30)%12;return 255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)));});}
const css=readFileSync('src/index.css','utf8');
function token(name:string){const value=css.match(new RegExp(`--${name}:\\s*([0-9.]+) ([0-9.]+)% ([0-9.]+)%`));if(!value)throw new Error(`Missing token ${name}`);return rgb(Number(value[1]),Number(value[2]),Number(value[3]));}
const ratio=(a:number[],b:number[])=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
it('atlas accent text and filled pills meet 4.5:1 AA contrast',()=>{expect(ratio(token('atlas-accent'),token('background'))).toBeGreaterThanOrEqual(4.5);expect(ratio(token('atlas-accent'),token('primary-foreground'))).toBeGreaterThanOrEqual(4.5);});
it('untasted stamp text meets 4.5:1 against its muted background',()=>expect(ratio(token('muted-foreground'),token('muted'))).toBeGreaterThanOrEqual(4.5));
