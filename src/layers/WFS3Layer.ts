import esri = __esri;

import {
    declared,
    property,
    subclass
} from "esri/core/accessorSupport/decorators";

import GraphicsLayer from "esri/layers/GraphicsLayer";
import { whenTrue } from "esri/core/watchUtils";
import Extent from "esri/geometry/Extent";
import esriRequest from "esri/request";
import { webMercatorToGeographic } from "esri/geometry/support/webMercatorUtils";
import Graphic from "esri/Graphic";
import MapView from "esri/views/MapView";
import MapPoint from "esri/geometry/Point";
import Polyline from "esri/geometry/Polyline";
import Polygon from "esri/geometry/Polygon";
import PopupTemplate from "esri/PopupTemplate";

interface LayerProperties extends esri.GraphicsLayerProperties {
    /**
     * Url of the WFS collection
     */
    url: string;
}

/**
 * A very simple WFS3 layer based on a graphics layer. It queries a WFS collection for features using BBOX 
 * parameter then draws Esri graphics.
 */
@subclass("layers.WFS3Layer")
export default class WFS3Layer extends declared(GraphicsLayer) {
    @property() url: string;

    constructor(options: LayerProperties) {
        super(options);
        this.on("layerview-create", (evt) => this._layerViewCreated(evt));
    }

    private _layerViewCreated(evt: any): void {
        const view = evt.layerView.view as MapView;

        // Handle view extent change
        whenTrue(view, "stationary", () => {
            if (view.extent) {
                this._draw(view.extent)
            }
        });
    }

    /**
     * Draws features in the view
     * @param extent The current view extent
     */
    private _draw(extent: Extent): void {
        console.log("draw");

        // Convert extent to lat/lon coords
        const projected = webMercatorToGeographic(extent) as Extent;

        // Set request parameters required by WFS3
        const params = {
            bbox: `${projected.xmin},${projected.ymin},${projected.xmax},${projected.ymax}`,
            f: "json"
        };

        // Query WFS service
        esriRequest(`${this.url}/items`, {
            query: params,
            responseType: "json"
        }).then((response: any) => {
            // Remove existing graphics
            // TODO: optimise rather than re-create each map extent change
            this.graphics.removeAll();

            response.data.features.forEach((feature: any) => {
                // Add features
                this.graphics.add(this._createGraphic(feature));
            });
        }).catch((err: Error) => {
            console.log(err);
        });
    }

    /**
     * Creates an Esri Graphic from GeoJSON
     * @param feature The GeoJSON feature
     */
    private _createGraphic(feature: any): Graphic {
        let geometry:any = {};
        let symbol:any = {};

        // Handle geometry type
        switch (feature.geometry.type) {
            case "Point":
                geometry = {
                    type: "point",
                    x: feature.geometry.coordinates[0],
                    y: feature.geometry.coordinates[1]
                } as MapPoint;

                symbol = {
                    type: "simple-marker",
                    color: [133, 133, 133, 0.5] 
                };
                break;
            case "Polyline":
                geometry = {
                    type: "polyline",
                    paths: feature.geometry.coordinates
                } as Polyline;

                symbol = {
                    type: "simple-line"
                };
                break;
            case "Polygon":
                geometry = {
                    type: "polygon",
                    rings: feature.geometry.coordinates
                } as Polygon

                symbol = {
                    type: "simple-fill"
                };
                break;
        }

        // Create graphic
        return new Graphic({
            geometry: geometry,
            attributes: feature.properties,
            symbol: symbol,
            popupTemplate: this._createPopupTemplate(this.title, feature.properties)
        });
    }

    /**
     * Create a PopupTemplate from GeoJSON properties
     * @param title The title of the popup
     * @param properties The properties to display
     */
    private _createPopupTemplate(title: string, properties: any): PopupTemplate {
        const fieldInfos = [] as any;

        // Add each property name
        for (let prop in properties) {
            fieldInfos.push({ fieldName: prop });
        }

        // Create template
        return {
            title: title,
            content: [
                {
                    type: "fields",
                    fieldInfos: fieldInfos
                }
            ]
        } as any;
    }
}