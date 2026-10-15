import { Campsite } from '../data/campsites';

export type CampingStyle = 'rv' | 'tent' | 'backpack' | 'canoe' | 'horse';

export interface TripFilters {
  campingStyle: CampingStyle;
  rvLengthFt: number; // e.g. 25
  requiresElectric30: boolean;
  requiresElectric50: boolean;
  requiresPullThrough: boolean;
  requiresWaterSewer: boolean;
  partySize: number; // people
  vehiclesCount: number;
  hasPets: boolean;
  requiresAda: boolean;
  strictAdaOnly: boolean; // if true, only ADA === true. if false, allow unknown too
  maxDistanceToRestroomFt?: number;
  preferWaterfront: boolean;
  preferShade: boolean;
  maxCorridorDistanceMiles: number; // 5, 15, 30, 50
}

export interface MatchEvaluation {
  campsite: Campsite;
  isEligible: boolean;
  score: number; // 0 - 100
  status: 'perfect' | 'good' | 'potential' | 'ineligible';
  tags: string[];
  reasons: string[];
  unknowns: string[];
  ineligibilityReasons: string[];
}

export function evaluateCampsite(site: Campsite, filters: TripFilters): MatchEvaluation {
  const reasons: string[] = [];
  const unknowns: string[] = [];
  const ineligibilityReasons: string[] = [];
  const tags: string[] = [];
  let score = 50; // base score

  // 1. Capacity check: People
  if (site.maxPeople !== null) {
    if (site.maxPeople < filters.partySize) {
      ineligibilityReasons.push(`Max ${site.maxPeople} people (party has ${filters.partySize})`);
    } else {
      reasons.push(`Accommodates ${site.maxPeople} people`);
    }
  } else {
    unknowns.push('Maximum party capacity not specified');
  }

  // 2. Capacity check: Vehicles
  if (site.maxVehicles !== null) {
    if (site.maxVehicles < filters.vehiclesCount) {
      ineligibilityReasons.push(`Max ${site.maxVehicles} vehicle(s) allowed`);
    }
  }

  // 3. Pets rule
  if (filters.hasPets) {
    if (site.petsAllowed === false) {
      ineligibilityReasons.push('Pets strictly not permitted');
    } else if (site.petsAllowed === true) {
      reasons.push('Pet friendly (confirmed)');
      tags.push('Pets Allowed');
      score += 10;
    } else {
      // null = unknown per user prompt instructions!
      unknowns.push('Pet policy unknown (not prohibited)');
      tags.push('Pets: Unknown');
    }
  }

  // 4. Accessibility (ADA) rule
  if (filters.requiresAda) {
    if (site.adaAccessible === true) {
      reasons.push('ADA accessible campsite (confirmed)');
      tags.push('ADA Accessible');
      score += 25;
    } else if (site.adaAccessible === false) {
      ineligibilityReasons.push('Not ADA accessible');
    } else {
      // null = unknown per prompt instructions!
      if (filters.strictAdaOnly) {
        ineligibilityReasons.push('ADA accessibility unconfirmed (Strict filter enabled)');
      } else {
        unknowns.push('ADA status unknown (not ruled out)');
        tags.push('ADA: Unknown');
      }
    }
  } else if (site.adaAccessible === true) {
    tags.push('ADA Accessible');
  }

  // 5. Camping style & equipment requirements
  if (filters.campingStyle === 'rv') {
    // Check if site accommodates RVs
    const siteTypeLower = site.siteType.toLowerCase();
    const isDriveIn = siteTypeLower.includes('drive-in') || siteTypeLower.includes('electric') || siteTypeLower.includes('rv');
    
    if (siteTypeLower.includes('backpack') || siteTypeLower.includes('canoe') || siteTypeLower.includes('walk-in') || siteTypeLower.includes('cart-in')) {
      ineligibilityReasons.push(`Non-drive-in site (${site.siteType})`);
    }

    // Pad length check
    if (site.padLengthFt !== null) {
      if (site.padLengthFt < filters.rvLengthFt) {
        ineligibilityReasons.push(`Pad length (${site.padLengthFt}ft) shorter than RV (${filters.rvLengthFt}ft)`);
      } else {
        reasons.push(`${site.padLengthFt}ft driveway pad (fits ${filters.rvLengthFt}ft RV)`);
        score += 15;
      }
    } else {
      unknowns.push('Pad length unknown');
    }

    // Electric hookups
    if (filters.requiresElectric30) {
      if (site.electric30amp === false && !siteTypeLower.includes('electric')) {
        ineligibilityReasons.push('No 30-amp electric hookup');
      } else if (site.electric30amp === true || siteTypeLower.includes('electric')) {
        reasons.push('30-Amp Electric hookup available');
        tags.push('30A Electric');
        score += 10;
      } else {
        unknowns.push('Electric 30A status unknown');
      }
    }

    if (filters.requiresElectric50) {
      if (site.electric50amp === false) {
        ineligibilityReasons.push('No 50-amp electric hookup');
      } else if (site.electric50amp === true) {
        reasons.push('50-Amp Electric hookup available');
        tags.push('50A Electric');
        score += 15;
      } else {
        unknowns.push('Electric 50A status unknown');
      }
    }

    if (filters.requiresPullThrough) {
      if (site.pullThrough === false) {
        ineligibilityReasons.push('Back-in only (no pull-through)');
      } else if (site.pullThrough === true) {
        reasons.push('Pull-through driveway');
        tags.push('Pull-Through');
        score += 10;
      } else {
        unknowns.push('Driveway configuration unknown');
      }
    }

    if (filters.requiresWaterSewer) {
      if (!siteTypeLower.includes('sewer') && !siteTypeLower.includes('water')) {
        score -= 10;
      } else {
        reasons.push('Full hookups (Water/Sewer)');
        tags.push('Full Hookup');
        score += 15;
      }
    }
  } else if (filters.campingStyle === 'tent') {
    const siteTypeLower = site.siteType.toLowerCase();
    if (siteTypeLower.includes('equestrian') && !siteTypeLower.includes('standard')) {
      score -= 5;
    }
    if (site.tentPad) {
      reasons.push(`Tent pad surface: ${site.tentPad}`);
      tags.push(`Tent Pad: ${site.tentPad}`);
      score += 10;
    }
    if (site.shade === 'Fully') {
      reasons.push('Full natural tree shade');
      score += 8;
    }
  } else if (filters.campingStyle === 'backpack') {
    const siteTypeLower = site.siteType.toLowerCase();
    if (siteTypeLower.includes('backpack') || siteTypeLower.includes('hike-in')) {
      reasons.push('Backpack / hike-in primitive wilderness site');
      score += 30;
      tags.push('Backpack');
    } else {
      score -= 20;
    }
  } else if (filters.campingStyle === 'canoe') {
    const siteTypeLower = site.siteType.toLowerCase();
    if (siteTypeLower.includes('canoe') || siteTypeLower.includes('boat-in') || site.parkType.includes('Water Trail')) {
      reasons.push('Water trail / canoe-in water access campsite');
      score += 35;
      tags.push('Canoe-In');
    } else {
      score -= 20;
    }
  } else if (filters.campingStyle === 'horse') {
    const siteTypeLower = site.siteType.toLowerCase();
    if (siteTypeLower.includes('equestrian') || site.campground.toLowerCase().includes('horse')) {
      reasons.push('Equestrian horse facilities available');
      score += 40;
      tags.push('Equestrian');
    } else {
      ineligibilityReasons.push('No horse camping facilities');
    }
  }

  // Preferences & Amenities
  if (filters.preferWaterfront && site.waterfront === true) {
    reasons.push('Lakefront / riverfront location');
    tags.push('Waterfront');
    score += 12;
  }

  if (filters.preferShade && site.shade === 'Fully') {
    tags.push('Full Shade');
    score += 8;
  }

  if (site.fireRing) tags.push('Fire Ring');
  if (site.picnicTable) tags.push('Picnic Table');

  const isEligible = ineligibilityReasons.length === 0;

  // Determine overall status
  let status: 'perfect' | 'good' | 'potential' | 'ineligible' = 'ineligible';
  if (isEligible) {
    if (unknowns.length === 0 && score >= 75) {
      status = 'perfect';
    } else if (unknowns.length <= 2 && score >= 60) {
      status = 'good';
    } else {
      status = 'potential';
    }
  }

  return {
    campsite: site,
    isEligible,
    score: Math.min(100, Math.max(0, score)),
    status,
    tags,
    reasons,
    unknowns,
    ineligibilityReasons,
  };
}
