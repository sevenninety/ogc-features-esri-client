import VectorTileLayer from "esri/layers/VectorTileLayer";
import ArcGISMap from "esri/Map";

import WFS3Layer from "../layers/WFS3Layer";

// Create WFS layers
const wfsLayer1 = new WFS3Layer({
    url: "https://demo.pygeoapi.io/master/collections/lakes",
    title: "Large Lakes"
});

const wfsLayer2 = new WFS3Layer({
    url: "https://demo.pygeoapi.io/master/collections/utah_city_locations",
    title: "Cities in Utah"
});

export const map = new ArcGISMap({
    basemap: {
        baseLayers: [
            new VectorTileLayer({
                portalItem: {
                    // Topographic
                    id: "7dc6cea0b1764a1f9af2e679f642f0f5"
                }
            })
        ]
    },
    layers: [wfsLayer1, wfsLayer2]
});
