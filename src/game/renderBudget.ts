/** Pixel art needs crisp sampling, rather than a full Retina-size drawing buffer. */
export function renderRatio(width:number,height:number,deviceRatio:number){
 return Math.max(1,Math.min(deviceRatio||1,1.5,Math.sqrt(2_000_000/Math.max(1,width*height))));
}
