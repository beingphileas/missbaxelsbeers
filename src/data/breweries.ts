export type BreweryType = 'Trappist' | 'Family-owned' | 'Microbrewery' | 'Industrial';

export interface Beer {
  id: string;
  name: string;
  style: string;
  abv: number;
  flavorProfile: string[];
  foodPairing: string;
  isHiddenGem: boolean;
}

export interface Brewery {
  id: string;
  name: string;
  type: BreweryType;
  province: string;
  lat: number;
  lng: number;
  story: string;
  establishedYear: number;
  websiteUrl: string;
  beers: Beer[];
}

export const breweries: Brewery[] = [
  {
    id: '1',
    name: 'Orval',
    type: 'Trappist',
    province: 'Luxembourg',
    lat: 49.6378,
    lng: 5.3486,
    story: 'Nestled in the Gaume forests since 1132, Orval produces a single, iconic Trappist ale. The monks use Brettanomyces yeast for a wild, evolving character that deepens with each year of cellaring.',
    establishedYear: 1132,
    websiteUrl: 'https://www.orval.be',
    beers: [{ id: 'b1', name: 'Orval', style: 'Trappist Pale Ale', abv: 6.2, flavorProfile: ['Funky', 'Dry', 'Bitter'], foodPairing: 'Aged Gruyère or roasted chicken', isHiddenGem: false }],
  },
  {
    id: '2',
    name: 'Cantillon',
    type: 'Family-owned',
    province: 'Brussels',
    lat: 50.8440,
    lng: 4.3350,
    story: 'The last traditional lambic brewery in Brussels, Cantillon has been spontaneously fermenting beer since 1900. Their open coolship invites wild yeast from the Senne Valley air—a process unchanged for over a century.',
    establishedYear: 1900,
    websiteUrl: 'https://www.cantillon.be',
    beers: [{ id: 'b2', name: 'Gueuze 100% Lambic', style: 'Lambic', abv: 5.0, flavorProfile: ['Sour', 'Oak', 'Tart'], foodPairing: 'Fresh oysters or aged cheeses', isHiddenGem: false }],
  },
  {
    id: '3',
    name: 'Brouwerij Verzet',
    type: 'Microbrewery',
    province: 'West Flanders',
    lat: 50.8050,
    lng: 3.2870,
    story: 'Founded in 2013 by a young couple in Anzegem, Verzet ("Resistance") brews bold sour ales and barrel-aged experiments. Their Oud Bruin is a masterclass in controlled acidity.',
    establishedYear: 2013,
    websiteUrl: 'https://www.brouwerijverzet.be',
    beers: [{ id: 'b3', name: 'Oud Bruin', style: 'Flanders Oud Bruin', abv: 5.5, flavorProfile: ['Acidic', 'Cherry', 'Malt'], foodPairing: 'Dark chocolate tart', isHiddenGem: true }],
  },
  {
    id: '4',
    name: 'Westvleteren',
    type: 'Trappist',
    province: 'West Flanders',
    lat: 50.8880,
    lng: 2.7220,
    story: 'The most elusive beer in the world. The monks of Sint-Sixtus produce limited quantities, sold only at the abbey gate. No labels, no marketing—just unparalleled depth in every bottle.',
    establishedYear: 1838,
    websiteUrl: 'https://sintsixtus.be',
    beers: [{ id: 'b4', name: 'XII', style: 'Quadruple', abv: 10.2, flavorProfile: ['Dark Fruit', 'Toffee', 'Caramel'], foodPairing: 'Blue cheese or fig compote', isHiddenGem: false }],
  },
  {
    id: '5',
    name: 'Rochefort',
    type: 'Trappist',
    province: 'Namur',
    lat: 50.1590,
    lng: 5.2210,
    story: 'Brewed within the walls of the Abbey of Notre-Dame de Saint-Rémy since 1595. Rochefort\'s numbered ales (6, 8, 10) are benchmarks of Belgian dark ale, with the "10" standing as one of the world\'s finest.',
    establishedYear: 1595,
    websiteUrl: 'https://www.abbaye-rochefort.be',
    beers: [{ id: 'b5', name: '10', style: 'Quadruple', abv: 11.3, flavorProfile: ['Plum', 'Vinous', 'Rich'], foodPairing: 'Venison stew or dark chocolate', isHiddenGem: false }],
  },
  {
    id: '6',
    name: 'De Halve Maan',
    type: 'Family-owned',
    province: 'West Flanders',
    lat: 51.2050,
    lng: 3.2247,
    story: 'Bruges\' last active city brewery, operating since 1856. In 2016, they built a 3km underground beer pipeline from the historic brewery to the bottling plant—a feat of engineering and devotion.',
    establishedYear: 1856,
    websiteUrl: 'https://www.halvemaan.be',
    beers: [{ id: 'b6', name: 'Brugse Zot', style: 'Blond', abv: 6.0, flavorProfile: ['Spicy', 'Citrus', 'Crisp'], foodPairing: 'Moules-frites', isHiddenGem: false }],
  },
  {
    id: '7',
    name: 'Chimay',
    type: 'Trappist',
    province: 'Hainaut',
    lat: 50.0510,
    lng: 4.3170,
    story: 'The largest Trappist brewery, Chimay has been the gateway for countless beer lovers into the world of Belgian monastics. Their three core ales—Red, White, and Blue—define accessible complexity.',
    establishedYear: 1862,
    websiteUrl: 'https://www.chimay.com',
    beers: [{ id: 'b7', name: 'Blue', style: 'Strong Dark Ale', abv: 9.0, flavorProfile: ['Peppery', 'Caramel', 'Dried Fruit'], foodPairing: 'Chimay cheese or lamb', isHiddenGem: false }],
  },
  {
    id: '8',
    name: 'Duvel Moortgat',
    type: 'Industrial',
    province: 'Antwerp',
    lat: 51.0890,
    lng: 4.5070,
    story: 'When first tasted in 1923, a local shoemaker declared it "a real devil." The name stuck. Duvel\'s 90-day brewing process and distinctive tulip glass have made it Belgium\'s most recognized strong blond.',
    establishedYear: 1871,
    websiteUrl: 'https://www.duvel.com',
    beers: [{ id: 'b8', name: 'Duvel', style: 'Strong Blond', abv: 8.5, flavorProfile: ['Effervescent', 'Pear', 'Spice'], foodPairing: 'Thai curry or grilled prawns', isHiddenGem: false }],
  },
  {
    id: '9',
    name: '3 Fonteinen',
    type: 'Family-owned',
    province: 'Flemish Brabant',
    lat: 50.7670,
    lng: 4.3050,
    story: 'Master blenders in Beersel since 1887. 3 Fonteinen sources and blends lambics with extraordinary precision. Their Oude Geuze is considered the gold standard of the style.',
    establishedYear: 1887,
    websiteUrl: 'https://www.3fonteinen.be',
    beers: [{ id: 'b9', name: 'Aandacht', style: 'Lambic', abv: 6.5, flavorProfile: ['Earthy', 'Lemon', 'Funk'], foodPairing: 'Sushi or soft goat cheese', isHiddenGem: true }],
  },
  {
    id: '10',
    name: 'St. Bernardus',
    type: 'Family-owned',
    province: 'West Flanders',
    lat: 50.8460,
    lng: 2.6520,
    story: 'Once the licensed brewer for Westvleteren, St. Bernardus carried on the tradition with their own recipes after 1992. Their Abt 12 is regularly ranked among the world\'s greatest beers.',
    establishedYear: 1946,
    websiteUrl: 'https://www.sintbernardus.be',
    beers: [{ id: 'b10', name: 'Abt 12', style: 'Quadruple', abv: 10.0, flavorProfile: ['Raisin', 'Bread', 'Spice'], foodPairing: 'Beef carbonade or crème brûlée', isHiddenGem: false }],
  },
  {
    id: '11',
    name: 'De Dolle Brouwers',
    type: 'Microbrewery',
    province: 'West Flanders',
    lat: 51.0580,
    lng: 2.9780,
    story: 'The "Mad Brewers" of Esen have been creating eccentric, artistic beers since 1980. Their brewery is as much a gallery as a production facility, with each beer telling a wild story.',
    establishedYear: 1980,
    websiteUrl: 'https://www.dedollebrouwers.be',
    beers: [{ id: 'b11', name: 'Arabier', style: 'Strong Pale Ale', abv: 8.0, flavorProfile: ['Hoppy', 'Honey', 'Yeast'], foodPairing: 'Spiced couscous or grilled fish', isHiddenGem: true }],
  },
  {
    id: '12',
    name: 'Bosteels',
    type: 'Industrial',
    province: 'East Flanders',
    lat: 51.0170,
    lng: 4.0720,
    story: 'Seven generations of Bosteels have brewed in Buggenhout. Their Tripel Karmeliet—brewed with wheat, oats, and barley—arrives in a hand-painted glass that has become a collector\'s icon.',
    establishedYear: 1791,
    websiteUrl: 'https://www.bestbelgianspecialbeers.be',
    beers: [{ id: 'b12', name: 'Tripel Karmeliet', style: 'Tripel', abv: 8.4, flavorProfile: ['Grainy', 'Vanilla', 'Silk'], foodPairing: 'Lobster or white asparagus', isHiddenGem: false }],
  },
  {
    id: '13',
    name: 'Rodenbach',
    type: 'Family-owned',
    province: 'West Flanders',
    lat: 50.9480,
    lng: 3.1270,
    story: 'Home to 294 massive oak foeders, some over 150 years old. Rodenbach\'s Flanders Red ales age for up to two years in these vessels, developing a complexity that rivals fine wine.',
    establishedYear: 1821,
    websiteUrl: 'https://www.rodenbach.be',
    beers: [{ id: 'b13', name: 'Grand Cru', style: 'Flanders Red', abv: 6.0, flavorProfile: ['Balsamic', 'Berry', 'Oak'], foodPairing: 'Duck confit or raspberry tart', isHiddenGem: false }],
  },
  {
    id: '14',
    name: 'Westmalle',
    type: 'Trappist',
    province: 'Antwerp',
    lat: 51.2870,
    lng: 4.6690,
    story: 'The brewery that defined the Dubbel and Tripel styles as we know them. Since 1836, the monks of Westmalle have set the standard that every Belgian abbey ale aspires to match.',
    establishedYear: 1836,
    websiteUrl: 'https://www.trappistwestmalle.be',
    beers: [{ id: 'b14', name: 'Tripel', style: 'Tripel', abv: 9.5, flavorProfile: ['Banana', 'Clove', 'Dry'], foodPairing: 'Grilled chicken or fruit salad', isHiddenGem: false }],
  },
  {
    id: '15',
    name: 'Brasserie de la Senne',
    type: 'Microbrewery',
    province: 'Brussels',
    lat: 50.8580,
    lng: 4.3380,
    story: 'A fiercely independent Brussels brewery founded in 2003. Their Taras Boulba proves that sessionable beers can be extraordinary—dry, bitter, and bursting with hop aromatics at just 4.5% ABV.',
    establishedYear: 2003,
    websiteUrl: 'https://www.bfrfrfr.be',
    beers: [{ id: 'b15', name: 'Taras Boulba', style: 'Hoppy Blond', abv: 4.5, flavorProfile: ['Grassy', 'Lemon', 'Bitter'], foodPairing: 'Fish tacos or garden salad', isHiddenGem: true }],
  },
];

export const provinces = [...new Set(breweries.map(b => b.province))].sort();
export const breweryTypes: BreweryType[] = ['Trappist', 'Family-owned', 'Microbrewery', 'Industrial'];
export const beerStyles = [...new Set(breweries.flatMap(b => b.beers.map(beer => beer.style)))].sort();
