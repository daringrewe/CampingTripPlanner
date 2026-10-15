import csv
import json
import os

input_csv = 'src/data/campsites.csv'
output_json = 'src/data/campsites.json'
output_ts = 'src/data/campsites.ts'

def parse_bool(val):
    if not val:
        return None
    val = val.strip().lower()
    if val in ['yes', 'true', 'y', '1']:
        return True
    if val in ['no', 'false', 'n', '0']:
        return False
    return None

def parse_num(val):
    if not val:
        return None
    try:
        val = val.strip().replace(',', '')
        if '.' in val:
            return float(val)
        return int(val)
    except:
        return None

def parse_str(val):
    if not val:
        return None
    val = val.strip()
    return val if val else None

campsites = []
parks = {}

with open(input_csv, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    idx = 0
    for row in reader:
        idx += 1
        lat = parse_num(row.get('lat'))
        lon = parse_num(row.get('lon'))
        if lat is None or lon is None:
            continue
        
        park = row.get('park', '').strip()
        campground = row.get('campground', '').strip() or 'Main Campground'
        site_name = row.get('site_name', '').strip() or f'Site #{idx}'
        site_type = row.get('site_type', '').strip() or 'Drive-In'
        park_type = row.get('park_type', '').strip() or 'State Park'
        county = row.get('county', '').strip() or 'Unknown'
        tourism_region = row.get('tourism_region', '').strip() or 'Central'
        
        campsite = {
            'id': f"site-{idx}",
            'park': park,
            'parkType': park_type,
            'campground': campground,
            'siteName': site_name,
            'unitType': row.get('unit_type', '').strip() or 'Campsite',
            'siteType': site_type,
            'lat': float(lat),
            'lng': float(lon),
            'county': county,
            'tourismRegion': tourism_region,
            'electric30amp': parse_bool(row.get('electric_30amp')),
            'electric50amp': parse_bool(row.get('electric_50amp')),
            'padLengthFt': parse_num(row.get('pad_length_ft')),
            'padWidthFt': parse_num(row.get('pad_width_ft')),
            'padSurface': parse_str(row.get('pad_surface')),
            'pullThrough': parse_bool(row.get('pull_through')),
            'tentPad': parse_str(row.get('tent_pad')),
            'feetToRestroom': parse_num(row.get('feet_to_restroom')),
            'feetToShower': parse_num(row.get('feet_to_shower')),
            'feetToWater': parse_num(row.get('feet_to_water')),
            'feetToDumpStation': parse_num(row.get('feet_to_dump_station')),
            'waterfront': parse_bool(row.get('waterfront')),
            'petsAllowed': parse_bool(row.get('pets_allowed')),
            'maxPeople': parse_num(row.get('max_people')) or 6,
            'maxVehicles': parse_num(row.get('max_vehicles')) or 1,
            'fireRing': parse_bool(row.get('fire_ring')),
            'picnicTable': parse_bool(row.get('picnic_table')),
            'foodLocker': parse_bool(row.get('food_locker')),
            'shade': parse_str(row.get('shade')),
            'adaAccessible': parse_bool(row.get('ada_accessible')),
        }
        campsites.append(campsite)

        # Park aggregation
        if park not in parks:
            parks[park] = {
                'name': park,
                'parkType': park_type,
                'county': county,
                'tourismRegion': tourism_region,
                'lats': [],
                'lngs': [],
                'siteCount': 0,
                'electricCount': 0,
                'adaCount': 0,
                'petFriendlyCount': 0,
                'maxPadLength': 0,
                'siteTypes': set(),
                'campgrounds': set()
            }
        p = parks[park]
        p['lats'].append(float(lat))
        p['lngs'].append(float(lon))
        p['siteCount'] += 1
        if campsite['electric30amp'] or campsite['electric50amp'] or 'electric' in site_type.lower():
            p['electricCount'] += 1
        if campsite['adaAccessible']:
            p['adaCount'] += 1
        if campsite['petsAllowed'] is True:
            p['petFriendlyCount'] += 1
        if campsite['padLengthFt'] and campsite['padLengthFt'] > p['maxPadLength']:
            p['maxPadLength'] = campsite['padLengthFt']
        p['siteTypes'].add(site_type)
        p['campgrounds'].add(campground)

park_summaries = []
for name, p in sorted(parks.items()):
    center_lat = sum(p['lats']) / len(p['lats'])
    center_lng = sum(p['lngs']) / len(p['lngs'])
    park_summaries.append({
        'name': p['name'],
        'parkType': p['parkType'],
        'county': p['county'],
        'tourismRegion': p['tourismRegion'],
        'lat': round(center_lat, 6),
        'lng': round(center_lng, 6),
        'siteCount': p['siteCount'],
        'electricCount': p['electricCount'],
        'adaCount': p['adaCount'],
        'petFriendlyCount': p['petFriendlyCount'],
        'maxPadLength': p['maxPadLength'],
        'siteTypes': sorted(list(p['siteTypes'])),
        'campgrounds': sorted(list(p['campgrounds'])),
    })

with open(output_json, 'w', encoding='utf-8') as f:
    json.dump({'campsites': campsites, 'parks': park_summaries}, f, indent=2)

ts_content = f"""// Auto-generated Campsite Database
export interface Campsite {{
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
}}

export interface ParkSummary {{
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
}}

import data from './campsites.json';

export const CAMPSITES: Campsite[] = data.campsites as Campsite[];
export const PARK_SUMMARIES: ParkSummary[] = data.parks as ParkSummary[];

export const POPULAR_MN_DESTINATIONS = [
  {{
    name: 'Gooseberry Falls & Split Rock (North Shore)',
    description: 'Iconic Lake Superior shoreline, waterfalls & historic lighthouse',
    lat: 47.1426,
    lng: -91.4650,
    region: 'Northeast',
    category: 'Scenic Coastal'
  }},
  {{
    name: 'Itasca State Park (Mississippi Headwaters)',
    description: 'Wade across the origin of the mighty Mississippi River in old-growth pine forests',
    lat: 47.2360,
    lng: -95.2070,
    region: 'Northwest',
    category: 'Historic Wonder'
  }},
  {{
    name: 'Duluth & Canal Park',
    description: 'Lake Superior maritime port, iconic Aerial Lift Bridge, and scenic Lakewalk',
    lat: 46.7867,
    lng: -92.1005,
    region: 'Northeast',
    category: 'City & Coast'
  }},
  {{
    name: 'Tettegouche State Park (Palisade Head)',
    description: 'Towering cliffside bluffs over Lake Superior and roaring Baptism River cascades',
    lat: 47.3350,
    lng: -91.2000,
    region: 'Northeast',
    category: 'Hiking & Vistas'
  }},
  {{
    name: 'Cuyuna Country Recreation Area (Crosby)',
    description: 'World-renowned red dirt mountain biking around turquoise mine lakes',
    lat: 46.4915,
    lng: -93.9730,
    region: 'Central',
    category: 'Adventure'
  }},
  {{
    name: 'Whitewater State Park (Driftless Region)',
    description: 'Dramatic limestone bluff valleys, clear spring-fed trout streams, and no mosquitoes',
    lat: 44.0620,
    lng: -92.0450,
    region: 'Southern',
    category: 'Blufflands'
  }},
  {{
    name: 'Jay Cooke State Park (Carlton)',
    description: 'Swinging suspension bridge over roaring St. Louis River gorge and jagged slate beds',
    lat: 46.6575,
    lng: -92.3730,
    region: 'Northeast',
    category: 'Rivers & Geology'
  }},
  {{
    name: 'Lake Vermilion & Soudan Underground Mine',
    description: 'Historic deep underground mine tours and island-dotted northwoods lake',
    lat: 47.8440,
    lng: -92.1920,
    region: 'Northeast',
    category: 'History & Waters'
  }},
  {{
    name: 'Interstate State Park (Taylors Falls)',
    description: 'Deep glacial potholes and basalt cliffs on the scenic St. Croix River border',
    lat: 45.3930,
    lng: -92.6660,
    region: 'Metro',
    category: 'Glacial Geology'
  }},
  {{
    name: 'Blue Mounds State Park (Luverne)',
    description: 'Pink quartzite cliffs, native tallgrass prairie, and resident American bison herd',
    lat: 43.7200,
    lng: -96.1910,
    region: 'Southern',
    category: 'Prairie & Wildlife'
  }},
  {{
    name: 'Lake Bemidji State Park',
    description: 'Bog walk, Paul Bunyan & Babe statues, and expansive northwoods lake fun',
    lat: 47.5360,
    lng: -94.8250,
    region: 'Northwest',
    category: 'Lakes & Bogs'
  }},
  {{
    name: 'Scenic State Park (Bigfork)',
    description: 'Pristine untouched wilderness, virgin red pines, and serene Chase Point ridge',
    lat: 47.7140,
    lng: -93.5690,
    region: 'Northeast',
    category: 'Wilderness'
  }},
  {{
    name: 'Frontenac State Park (Lake Pepin)',
    description: 'Mississippi River birding paradise, sand beaches, and blufftop river panorama',
    lat: 44.5390,
    lng: -92.3510,
    region: 'Southern',
    category: 'Birding & River'
  }},
  {{
    name: 'Sibley State Park (New London)',
    description: 'Mount Tom vista viewing 50 miles, Lake Andrew beach, and lush oak forests',
    lat: 45.3150,
    lng: -95.0370,
    region: 'Central',
    category: 'Rolling Hills'
  }},
  {{
    name: 'Banning State Park (Sandstone)',
    description: 'Hell’s Gate rapids, sandstone quarry ruins, and rushing Kettle River',
    lat: 46.1570,
    lng: -92.8550,
    region: 'Northeast',
    category: 'Rapids & Ruins'
  }}
];
"""

with open(output_ts, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Processed {len(campsites)} campsites across {len(park_summaries)} parks!")
