// Auto-generated Campsite Database
export interface Campsite {
  id: string;
  park: string;
  parkType: string;
  campground: string;
  siteName: string;
  unitType: string;
  siteType: string;
  lat: number;
  lng: number;
  county: string;
  tourismRegion: string;
  electric30amp: boolean | null;
  electric50amp: boolean | null;
  padLengthFt: number | null;
  padWidthFt: number | null;
  padSurface: string | null;
  pullThrough: boolean | null;
  tentPad: string | null;
  feetToRestroom: number | null;
  feetToShower: number | null;
  feetToWater: number | null;
  feetToDumpStation: number | null;
  waterfront: boolean | null;
  petsAllowed: boolean | null;
  maxPeople: number | null;
  maxVehicles: number | null;
  fireRing: boolean | null;
  picnicTable: boolean | null;
  foodLocker: boolean | null;
  shade: 'Fully' | 'Partially' | 'None' | string | null;
  adaAccessible: boolean | null;
}

export interface ParkSummary {
  name: string;
  parkType: string;
  county: string;
  tourismRegion: string;
  lat: number;
  lng: number;
  siteCount: number;
  electricCount: number;
  adaCount: number;
  petFriendlyCount: number;
  maxPadLength: number;
  siteTypes: string[];
  campgrounds: string[];
}

import data from './campsites.json';

export const CAMPSITES: Campsite[] = data.campsites as Campsite[];
export const PARK_SUMMARIES: ParkSummary[] = data.parks as ParkSummary[];

export const POPULAR_MN_DESTINATIONS = [
  {
    name: 'Gooseberry Falls & Split Rock (North Shore)',
    description: 'Iconic Lake Superior shoreline, waterfalls & historic lighthouse',
    lat: 47.1426,
    lng: -91.4650,
    region: 'Northeast',
    category: 'Scenic Coastal'
  },
  {
    name: 'Itasca State Park (Mississippi Headwaters)',
    description: 'Wade across the origin of the mighty Mississippi River in old-growth pine forests',
    lat: 47.2360,
    lng: -95.2070,
    region: 'Northwest',
    category: 'Historic Wonder'
  },
  {
    name: 'Duluth & Canal Park',
    description: 'Lake Superior maritime port, iconic Aerial Lift Bridge, and scenic Lakewalk',
    lat: 46.7867,
    lng: -92.1005,
    region: 'Northeast',
    category: 'City & Coast'
  },
  {
    name: 'Tettegouche State Park (Palisade Head)',
    description: 'Towering cliffside bluffs over Lake Superior and roaring Baptism River cascades',
    lat: 47.3350,
    lng: -91.2000,
    region: 'Northeast',
    category: 'Hiking & Vistas'
  },
  {
    name: 'Cuyuna Country Recreation Area (Crosby)',
    description: 'World-renowned red dirt mountain biking around turquoise mine lakes',
    lat: 46.4915,
    lng: -93.9730,
    region: 'Central',
    category: 'Adventure'
  },
  {
    name: 'Whitewater State Park (Driftless Region)',
    description: 'Dramatic limestone bluff valleys, clear spring-fed trout streams, and no mosquitoes',
    lat: 44.0620,
    lng: -92.0450,
    region: 'Southern',
    category: 'Blufflands'
  },
  {
    name: 'Jay Cooke State Park (Carlton)',
    description: 'Swinging suspension bridge over roaring St. Louis River gorge and jagged slate beds',
    lat: 46.6575,
    lng: -92.3730,
    region: 'Northeast',
    category: 'Rivers & Geology'
  },
  {
    name: 'Lake Vermilion & Soudan Underground Mine',
    description: 'Historic deep underground mine tours and island-dotted northwoods lake',
    lat: 47.8440,
    lng: -92.1920,
    region: 'Northeast',
    category: 'History & Waters'
  },
  {
    name: 'Interstate State Park (Taylors Falls)',
    description: 'Deep glacial potholes and basalt cliffs on the scenic St. Croix River border',
    lat: 45.3930,
    lng: -92.6660,
    region: 'Metro',
    category: 'Glacial Geology'
  },
  {
    name: 'Blue Mounds State Park (Luverne)',
    description: 'Pink quartzite cliffs, native tallgrass prairie, and resident American bison herd',
    lat: 43.7200,
    lng: -96.1910,
    region: 'Southern',
    category: 'Prairie & Wildlife'
  },
  {
    name: 'Lake Bemidji State Park',
    description: 'Bog walk, Paul Bunyan & Babe statues, and expansive northwoods lake fun',
    lat: 47.5360,
    lng: -94.8250,
    region: 'Northwest',
    category: 'Lakes & Bogs'
  },
  {
    name: 'Scenic State Park (Bigfork)',
    description: 'Pristine untouched wilderness, virgin red pines, and serene Chase Point ridge',
    lat: 47.7140,
    lng: -93.5690,
    region: 'Northeast',
    category: 'Wilderness'
  },
  {
    name: 'Frontenac State Park (Lake Pepin)',
    description: 'Mississippi River birding paradise, sand beaches, and blufftop river panorama',
    lat: 44.5390,
    lng: -92.3510,
    region: 'Southern',
    category: 'Birding & River'
  },
  {
    name: 'Sibley State Park (New London)',
    description: 'Mount Tom vista viewing 50 miles, Lake Andrew beach, and lush oak forests',
    lat: 45.3150,
    lng: -95.0370,
    region: 'Central',
    category: 'Rolling Hills'
  },
  {
    name: 'Banning State Park (Sandstone)',
    description: 'Hell’s Gate rapids, sandstone quarry ruins, and rushing Kettle River',
    lat: 46.1570,
    lng: -92.8550,
    region: 'Northeast',
    category: 'Rapids & Ruins'
  }
];
