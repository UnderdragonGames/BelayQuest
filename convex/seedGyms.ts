import { mutation } from "./_generated/server";

const MINNEAPOLIS_GYMS = [
  {
    name: "Bouldering Project - Minneapolis",
    address: "1433 West River Rd N",
    city: "Minneapolis",
    state: "MN",
    country: "US",
    latitude: 44.9967,
    longitude: -93.2783,
  },
  {
    name: "Bouldering Project - St. Paul",
    address: "42 W Water St",
    city: "St. Paul",
    state: "MN",
    country: "US",
    latitude: 44.9465,
    longitude: -93.0893,
  },
  {
    name: "Vertical Endeavors - Minneapolis",
    address: "2540 Nicollet Ave S",
    city: "Minneapolis",
    state: "MN",
    country: "US",
    latitude: 44.9598,
    longitude: -93.2783,
  },
  {
    name: "Vertical Endeavors - Bloomington",
    address: "9601 James Avenue South",
    city: "Bloomington",
    state: "MN",
    country: "US",
    latitude: 44.8408,
    longitude: -93.3088,
  },
  {
    name: "Vertical Endeavors - St. Paul",
    address: "855 Phalen Blvd",
    city: "St. Paul",
    state: "MN",
    country: "US",
    latitude: 44.9728,
    longitude: -93.0584,
  },
  {
    name: "Vertical Endeavors - Highland",
    address: "2550 Wabash Avenue",
    city: "St. Paul",
    state: "MN",
    country: "US",
    latitude: 44.9217,
    longitude: -93.1753,
  },
  {
    name: "Minnesota Climbing Cooperative",
    address: "1620 Central Ave NE #178",
    city: "Minneapolis",
    state: "MN",
    country: "US",
    latitude: 45.0005,
    longitude: -93.2470,
  },
  {
    name: "Big Island Bouldering",
    address: "1420 Xenium Ln N",
    city: "Plymouth",
    state: "MN",
    country: "US",
    latitude: 44.9937,
    longitude: -93.4438,
  },
];

export const seedMinneapolisGyms = mutation({
  args: {},
  handler: async (ctx) => {
    const ids = [];
    for (const gym of MINNEAPOLIS_GYMS) {
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
