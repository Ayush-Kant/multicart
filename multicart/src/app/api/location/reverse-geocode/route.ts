import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const NOMINATIM_BASE_URL =
  process.env.GEOCODING_REVERSE_URL ||
  "https://nominatim.openstreetmap.org/reverse";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get("lat"));
    const lon = Number(searchParams.get("lon"));

    if (
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lon) ||
      lon < -180 ||
      lon > 180
    ) {
      return NextResponse.json(
        { message: "Valid latitude and longitude are required." },
        { status: 400 }
      );
    }

    const url = new URL(NOMINATIM_BASE_URL);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "18");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          process.env.GEOCODING_USER_AGENT ||
          "MultiCart/1.0 (delivery address lookup)",
        Accept: "application/json",
        "Accept-Language": "en",
      },
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            "Your location was detected, but the address lookup service is unavailable. Please enter the address manually.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const address = data.address || {};

    return NextResponse.json({
      latitude: lat,
      longitude: lon,
      displayName: data.display_name || "",
      address: {
        buildingNumber: address.house_number || "",
        street:
          address.road ||
          address.pedestrian ||
          address.footway ||
          "",
        area:
          address.neighbourhood ||
          address.suburb ||
          address.quarter ||
          address.residential ||
          "",
        city:
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          "",
        state: address.state || "",
        pincode: address.postcode || "",
        country: address.country || "India",
        countryCode: address.country_code || "in",
      },
      attribution: "© OpenStreetMap contributors",
    });
  } catch (error) {
    console.error("REVERSE GEOCODING ERROR:", error);

    return NextResponse.json(
      {
        message:
          "Your location was detected, but we could not resolve the address automatically. Please enter the address manually.",
      },
      { status: 502 }
    );
  }
}
