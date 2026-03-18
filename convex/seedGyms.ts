import { mutation } from "./_generated/server";

type GymType = "bouldering" | "rope" | "both";

interface GymData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  website?: string;
  gymType?: GymType;
}

const US_GYMS: GymData[] = [
  // ─── Minneapolis / St. Paul, MN ─────────────────────────────────────────
  {
    name: "Bouldering Project - Minneapolis",
    address: "1433 West River Rd N",
    city: "Minneapolis",
    state: "MN",
    country: "US",
    latitude: 44.9967,
    longitude: -93.2783,
    website: "https://boulderingproject.com/minneapolis",
    gymType: "bouldering",
  },
  {
    name: "Bouldering Project - St. Paul",
    address: "42 W Water St",
    city: "St. Paul",
    state: "MN",
    country: "US",
    latitude: 44.9465,
    longitude: -93.0893,
    website: "https://boulderingproject.com/stpaul",
    gymType: "bouldering",
  },
  {
    name: "Vertical Endeavors - Minneapolis",
    address: "2540 Nicollet Ave S",
    city: "Minneapolis",
    state: "MN",
    country: "US",
    latitude: 44.9598,
    longitude: -93.2783,
    website: "https://verticalendeavors.com",
    gymType: "both",
  },
  {
    name: "Vertical Endeavors - Bloomington",
    address: "9601 James Avenue South",
    city: "Bloomington",
    state: "MN",
    country: "US",
    latitude: 44.8408,
    longitude: -93.3088,
    website: "https://verticalendeavors.com",
    gymType: "both",
  },
  {
    name: "Vertical Endeavors - St. Paul",
    address: "855 Phalen Blvd",
    city: "St. Paul",
    state: "MN",
    country: "US",
    latitude: 44.9728,
    longitude: -93.0584,
    website: "https://verticalendeavors.com",
    gymType: "both",
  },
  {
    name: "Vertical Endeavors - Highland",
    address: "2550 Wabash Avenue",
    city: "St. Paul",
    state: "MN",
    country: "US",
    latitude: 44.9217,
    longitude: -93.1753,
    website: "https://verticalendeavors.com",
    gymType: "both",
  },
  {
    name: "Minnesota Climbing Cooperative",
    address: "1620 Central Ave NE #178",
    city: "Minneapolis",
    state: "MN",
    country: "US",
    latitude: 45.0005,
    longitude: -93.247,
    website: "https://mnclimbing.org",
    gymType: "both",
  },
  {
    name: "Big Island Bouldering",
    address: "1420 Xenium Ln N",
    city: "Plymouth",
    state: "MN",
    country: "US",
    latitude: 44.9937,
    longitude: -93.4438,
    gymType: "bouldering",
  },

  // ─── Seattle, WA ─────────────────────────────────────────────────────────
  {
    name: "Bouldering Project - Seattle",
    address: "2208 1st Ave S",
    city: "Seattle",
    state: "WA",
    country: "US",
    latitude: 47.5833,
    longitude: -122.3394,
    website: "https://boulderingproject.com/seattle",
    gymType: "bouldering",
  },
  {
    name: "Stone Gardens - Bellevue",
    address: "1411 132nd Ave NE",
    city: "Bellevue",
    state: "WA",
    country: "US",
    latitude: 47.7276,
    longitude: -122.1367,
    website: "https://stonegardens.com",
    gymType: "both",
  },
  {
    name: "Movement - Issaquah",
    address: "735 NW Gilman Blvd",
    city: "Issaquah",
    state: "WA",
    country: "US",
    latitude: 47.5319,
    longitude: -122.0339,
    website: "https://movementgyms.com",
    gymType: "both",
  },

  // ─── Denver / Boulder, CO ────────────────────────────────────────────────
  {
    name: "Bouldering Project - Denver",
    address: "3300 Walnut St",
    city: "Denver",
    state: "CO",
    country: "US",
    latitude: 39.7558,
    longitude: -104.9821,
    website: "https://boulderingproject.com/denver",
    gymType: "bouldering",
  },
  {
    name: "The Spot - Boulder",
    address: "3240 Prairie Ave",
    city: "Boulder",
    state: "CO",
    country: "US",
    latitude: 40.0126,
    longitude: -105.2367,
    website: "https://thespotgym.com",
    gymType: "bouldering",
  },
  {
    name: "Movement - Denver",
    address: "3479 S Logan St",
    city: "Englewood",
    state: "CO",
    country: "US",
    latitude: 39.6562,
    longitude: -104.9851,
    website: "https://movementgyms.com",
    gymType: "both",
  },
  {
    name: "Earth Treks - Denver",
    address: "21 W Flatiron Crossing Dr",
    city: "Broomfield",
    state: "CO",
    country: "US",
    latitude: 39.9345,
    longitude: -105.1266,
    website: "https://earthtreksclimbing.com",
    gymType: "both",
  },

  // ─── Los Angeles, CA ─────────────────────────────────────────────────────
  {
    name: "Bouldering Project - LA",
    address: "4640 W Sunset Blvd",
    city: "Los Angeles",
    state: "CA",
    country: "US",
    latitude: 34.0912,
    longitude: -118.2963,
    website: "https://boulderingproject.com/la",
    gymType: "bouldering",
  },
  {
    name: "Sender One - Santa Ana",
    address: "300 S Flower St",
    city: "Santa Ana",
    state: "CA",
    country: "US",
    latitude: 33.7462,
    longitude: -117.8611,
    website: "https://senderoneclimbing.com",
    gymType: "both",
  },
  {
    name: "Hangar 18 - Upland",
    address: "1222 W Arrow Hwy",
    city: "Upland",
    state: "CA",
    country: "US",
    latitude: 34.095,
    longitude: -117.6654,
    website: "https://hangar18climbing.com",
    gymType: "bouldering",
  },

  // ─── San Francisco Bay Area, CA ──────────────────────────────────────────
  {
    name: "Dogpatch Boulders",
    address: "2573 3rd St",
    city: "San Francisco",
    state: "CA",
    country: "US",
    latitude: 37.7577,
    longitude: -122.3894,
    website: "https://dogpatchboulders.com",
    gymType: "bouldering",
  },
  {
    name: "Movement - Berkeley",
    address: "2100 Milvia St",
    city: "Berkeley",
    state: "CA",
    country: "US",
    latitude: 37.8694,
    longitude: -122.2743,
    website: "https://movementgyms.com",
    gymType: "both",
  },
  {
    name: "Great Western Power Company",
    address: "88 Clay St",
    city: "Oakland",
    state: "CA",
    country: "US",
    latitude: 37.8013,
    longitude: -122.2752,
    website: "https://touchstoneclimbing.com",
    gymType: "both",
  },

  // ─── Portland, OR ────────────────────────────────────────────────────────
  {
    name: "Movement - Portland",
    address: "1100 NW Glisan St",
    city: "Portland",
    state: "OR",
    country: "US",
    latitude: 45.5249,
    longitude: -122.6905,
    website: "https://movementgyms.com",
    gymType: "both",
  },

  // ─── Chicago, IL ─────────────────────────────────────────────────────────
  {
    name: "First Ascent - Avondale",
    address: "3212 N Sacramento Ave",
    city: "Chicago",
    state: "IL",
    country: "US",
    latitude: 41.9375,
    longitude: -87.7002,
    website: "https://firstascentclimbing.com",
    gymType: "both",
  },
  {
    name: "Movement - Wicker Park",
    address: "2035 W North Ave",
    city: "Chicago",
    state: "IL",
    country: "US",
    latitude: 41.9106,
    longitude: -87.6789,
    website: "https://movementgyms.com",
    gymType: "both",
  },

  // ─── New York, NY ────────────────────────────────────────────────────────
  {
    name: "The Cliffs at LIC",
    address: "11-11 44th Dr",
    city: "Long Island City",
    state: "NY",
    country: "US",
    latitude: 40.7456,
    longitude: -73.9479,
    website: "https://thecliffsclimbing.com",
    gymType: "both",
  },
  {
    name: "VITAL Climbing - Brooklyn",
    address: "202 Evergreen Ave",
    city: "Brooklyn",
    state: "NY",
    country: "US",
    latitude: 40.7042,
    longitude: -73.9214,
    website: "https://vitalclimbing.com",
    gymType: "both",
  },
  {
    name: "Brooklyn Boulders - Gowanus",
    address: "575 Degraw St",
    city: "Brooklyn",
    state: "NY",
    country: "US",
    latitude: 40.6756,
    longitude: -74.0018,
    website: "https://brooklynboulders.com",
    gymType: "both",
  },

  // ─── Boston, MA ──────────────────────────────────────────────────────────
  {
    name: "Brooklyn Boulders - Boston",
    address: "12 Plimpton St",
    city: "Boston",
    state: "MA",
    country: "US",
    latitude: 42.3419,
    longitude: -71.0696,
    website: "https://brooklynboulders.com",
    gymType: "both",
  },
  {
    name: "Central Rock Gym - Watertown",
    address: "174 N Beacon St",
    city: "Watertown",
    state: "MA",
    country: "US",
    latitude: 42.3696,
    longitude: -71.1763,
    website: "https://centralrockgym.com",
    gymType: "both",
  },

  // ─── Washington DC area ──────────────────────────────────────────────────
  {
    name: "Earth Treks - Rockville",
    address: "16249 Oakland Rd",
    city: "Gaithersburg",
    state: "MD",
    country: "US",
    latitude: 39.1548,
    longitude: -77.2045,
    website: "https://earthtreksclimbing.com",
    gymType: "both",
  },
  {
    name: "Earth Treks - Columbia",
    address: "7125 Columbia Gateway Dr",
    city: "Columbia",
    state: "MD",
    country: "US",
    latitude: 39.1748,
    longitude: -76.8503,
    website: "https://earthtreksclimbing.com",
    gymType: "both",
  },

  // ─── Atlanta, GA ─────────────────────────────────────────────────────────
  {
    name: "Stone Summit - Atlanta",
    address: "1700 Enterprise Way SE",
    city: "Atlanta",
    state: "GA",
    country: "US",
    latitude: 33.7454,
    longitude: -84.3547,
    website: "https://stonesummit.com",
    gymType: "both",
  },

  // ─── Austin, TX ──────────────────────────────────────────────────────────
  {
    name: "Austin Bouldering Project",
    address: "8716 Research Blvd",
    city: "Austin",
    state: "TX",
    country: "US",
    latitude: 30.3649,
    longitude: -97.7199,
    website: "https://austinboulderingproject.com",
    gymType: "bouldering",
  },
  {
    name: "Crux Climbing Center",
    address: "700 Bastrop Hwy",
    city: "Austin",
    state: "TX",
    country: "US",
    latitude: 30.2484,
    longitude: -97.7094,
    website: "https://cruxclimbing.com",
    gymType: "both",
  },
];

/**
 * Seeds the gym database with real US climbing gyms.
 * Idempotent: skips gyms that already exist by name.
 */
export const seedUSGyms = mutation({
  args: {},
  handler: async (ctx) => {
    const inserted: { name: string }[] = [];
    const skipped: { name: string }[] = [];

    for (const gym of US_GYMS) {
      // Check for existing gym by name to avoid duplicates
      const existing = await ctx.db
        .query("gyms")
        .filter((q) => q.eq(q.field("name"), gym.name))
        .first();

      if (existing) {
        skipped.push({ name: gym.name });
        continue;
      }

      await ctx.db.insert("gyms", {
        ...gym,
        source: "seed",
        verified: true,
      });
      inserted.push({ name: gym.name });
    }

    return {
      inserted: inserted.length,
      skipped: skipped.length,
      insertedGyms: inserted,
    };
  },
});

// Keep the old Minneapolis-only seed for backward compatibility
export const seedMinneapolisGyms = mutation({
  args: {},
  handler: async (ctx) => {
    const minneapolisGyms = US_GYMS.filter((g) => g.state === "MN");
    const ids = [];
    for (const gym of minneapolisGyms) {
      const id = await ctx.db.insert("gyms", {
        ...gym,
        source: "seed",
        verified: true,
      });
      ids.push({ id, name: gym.name });
    }
    return ids;
  },
});
