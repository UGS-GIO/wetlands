require([
    // ArcGIS
    "esri/Map",
    "esri/views/MapView",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/layers/GraphicsLayer",
    "esri/layers/ImageryLayer",
    "esri/layers/support/RasterFunction",
    "esri/Basemap",
    "esri/widgets/BasemapGallery",
    "esri/widgets/BasemapGallery/support/LocalBasemapsSource",
    "esri/widgets/Sketch/SketchViewModel",
    "esri/widgets/Sketch",
    "esri/Graphic",
    "esri/layers/GroupLayer",
    "esri/tasks/Geoprocessor",
    "esri/tasks/support/FeatureSet",
    "esri/smartMapping/renderers/color",
    "esri/smartMapping/statistics/histogram",
    "esri/widgets/smartMapping/ClassedColorSlider",
    //Layers
    "esri/layers/FeatureLayer",
    "esri/layers/MapImageLayer",
    //Tasks  
    "esri/tasks/support/Query",
    "esri/tasks/QueryTask",
    // Widgets
    "esri/widgets/Home",
    "esri/widgets/ScaleBar",
    "esri/widgets/Zoom",
    "esri/widgets/Compass",
    "esri/widgets/Search",
    "esri/widgets/Locate",
    "esri/widgets/Legend",
    "esri/widgets/Expand",
    "esri/widgets/LayerList",
    "esri/widgets/BasemapToggle",
    "esri/core/watchUtils",
    "esri/tasks/support/RelationshipQuery",
    "esri/popup/content/AttachmentsContent",

    // Bootstrap
    "bootstrap/Collapse",
    "bootstrap/Dropdown",

    // Dojo
    "dojo/query",
    "dojo/store/Memory",
    "dojo/data/ObjectStore",
    "dojo/data/ItemFileReadStore",
    "dojox/grid/DataGrid",
    "dgrid/OnDemandGrid",
    "dgrid/extensions/ColumnHider",
    "dgrid/Selection",
    "dstore/legacy/StoreAdapter",
    "dgrid/List",
    "dojo/_base/declare",
    "dojo/parser",
    "dojo/aspect",
    "dojo/request",
    "dojo/mouse",

    // Calcite Maps
    "calcite-maps/calcitemaps-v0.9",

    // Calcite Maps ArcGIS Support
    "calcite-maps/calcitemaps-arcgis-support-v0.10",
    "dojo/on",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/domReady!"
], function(Map, MapView, SimpleMarkerSymbol, GraphicsLayer, ImageryLayer, RasterFunction, Basemap, BasemapGallery, LocalBasemapsSource, SketchViewModel, Sketch, Graphic, GroupLayer, Geoprocessor, FeatureSet, colorRendererCreator, histogram, ClassedColorSlider, FeatureLayer, MapImageLayer, Query, QueryTask, Home, ScaleBar, Zoom, Compass, Search, Locate, Legend, Expand, LayerList, BasemapToggle, watchUtils, RelationshipQuery, AttachmentsContent, Collapse, Dropdown, query, Memory, ObjectStore, ItemFileReadStore, DataGrid, OnDemandGrid, ColumnHider, Selection, StoreAdapter, List, declare, parser, aspect, request, mouse, CalciteMaps, CalciteMapArcGISSupport, on, arrayUtils, dom, domClass, domConstruct) {

    var gpUrl ="https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/WetlandsDownload/GPServer/ExtractWetlandsData";

    //let graphic = {};
            var tempGraphic = null;          
            let editGraphic;
            // GraphicsLayer to hold graphics created via sketch view model
            const tempGraphicsLayer = new GraphicsLayer({
                listMode: "hide",
            });
        //variables for landscape data
    let layerSelect, fieldSelect, classSelect, numClassesInput, slider;
           

    //custom basemap layer of false color IR


    var serviceRFT = new RasterFunction({
        functionName: "FalseColorComposite",
        variableName: "Raster"
    });

    var IRlayer = new ImageryLayer({
        url: "https://utility.arcgis.com/usrsvcs/servers/0d7e1a9daec346eb9315cba948467b46/rest/services/NAIP/ImageServer",
        renderingRule: serviceRFT
    });

    var irBase = new Basemap({
        baseLayers: [IRlayer],
        title: "False Color Comp from NAIP",
        id: "irBase",
        thumbnailUrl: "https://geology.utah.gov/apps/jay/irThumb.PNG"
    });

    let baseSource = new LocalBasemapsSource({
        basemaps: [Basemap.fromId("hybrid"), Basemap.fromId("streets"), Basemap.fromId("gray"), irBase]
    });



    // Map
    var map = new Map({
        basemap: "hybrid",
        //layers: [plantSites, ecoRegions],
        //ground: "world-elevation",
    });

    // View
    var mapView = new MapView({
        container: "mapViewDiv",
        map: map,
        center: [-112, 40.7],
        zoom: 11,
        highlightOptions: {
            color: "#2B65EC",
            fillOpacity: 0.4
        },
        // padding: {
        //   top: 50,
        //   bottom: 0
        // },
        ui: {
            components: []
        }
    });

    // Popup and panel sync
    mapView.when(function() {
        CalciteMapArcGISSupport.setPopupPanelSync(mapView);
    });
    // Search - add to navbar
    var searchWidget = new Search({
        container: "searchWidgetDiv",
        view: mapView
    });
    CalciteMapArcGISSupport.setSearchExpandEvents(searchWidget);

    // Map widgets
    var home = new Home({
        view: mapView
    });
    mapView.ui.add(home, "top-left");
    var zoom = new Zoom({
        view: mapView
    });
    mapView.ui.add(zoom, "top-left");
    var compass = new Compass({
        view: mapView
    });
    mapView.ui.add(compass, "top-left");

    var basemapGallery = new BasemapGallery({
        view: mapView,
        container: baseList,
        source: baseSource
    });


    var locateWidget = new Locate({
        view: mapView,   // Attaches the Locate button to the view
        graphic: new Graphic({
          symbol: { type: "simple-marker" }  // overwrites the default symbol used for the
          // graphic placed at the location of the user when found
        })
      });
      
      mapView.ui.add(locateWidget, "top-left");



    var scaleBar = new ScaleBar({
        view: mapView,
        unit: "dual" // The scale bar displays both metric and non-metric units.
    });

    // Add the widget to the bottom left corner of the view
    mapView.ui.add(scaleBar, {
        position: "bottom-left"
    });

    mapView.map.add(tempGraphicsLayer);

    var classExpand = new Expand({
        view: mapView,
          content: document.getElementById("fieldDiv"),
          expanded: true,
          expandIconClass: "esri-icon-settings2"
      });
      mapView.ui.add(classExpand, "bottom-right");

//hides or shows calcite panel
      function showHideCalcitePanels(showPanel, showCollapse){
        // hide all windows
        query(".panel.in").removeClass("in");   //close any open panels
        //query(".panel-collapse").removeClass("in");

        // if specified show this calcite panel
        // if (showPanel){
        //   query(showCollapse).collapse("show");
        //   query(showCollapse).parent().collapse('show');
        // }
      }

    //Create popup content

    contentHUC12 = function(feature) {
        console.log(feature);
        var contentHUC12 = "";


        if (feature.graphic.attributes.huc12_name) {
            contentHUC12 += "<span class='bold' title=''><b>Watershed Name: </b></span>{huc12_name}<br/>";
        }


        if (feature.graphic.attributes.huc12) {
            contentHUC12 += "<span class='bold' title=''><b>Watershed Identifier: </b></span>{huc12}<br/>";
        }
        if (feature.graphic.attributes.surface_water_plot) {
            contentHUC12 += "<span class='bold'><b>Surface Water Plot: </b></span>" + "<a href='{surface_water_plot}' target='_blank'>Opens in new tab</a>";
        } else {
            contentHUC12 += "<span class='bold'><b>Surface Water Plot: </b></span>Surface Water Plot not currently available.";
        }

        return contentHUC12;
    }

    contentHUC8 = function(feature) {
        console.log(feature);
        var contentHUC8 = "";


        if (feature.graphic.attributes.huc8_name) {
            contentHUC8 += "<span class='bold' title=''><b>Sub-basin Name: </b></span>{huc8_name}<br/>";
        }


        if (feature.graphic.attributes.huc8) {
            contentHUC8 += "<span class='bold' title=''><b>Sub-basin Identifier: </b></span>{huc8}<br/>";
        }
        if (feature.graphic.attributes.surface_water_plot) {
            contentHUC8 += "<span class='bold'><b>Surface Water Plot: </b></span>" + "<a href='{surface_water_plot}' target='_blank'>Opens in new tab</a>";
        } else {
            contentHUC8 += "<span class='bold'><b>Surface Water Plot: </b></span>Surface Water Plot not currently available.";
        }

        return contentHUC8;
    }

    contentPro = function(feature) {
        console.log(feature);
        var contentPro = "";


        if (feature.graphic.attributes.IMAGE_YR) {
            contentPro += "<span class='bold' title='Image Year'><b>Image Year: </b></span>{IMAGE_YR}<br/>";
        }


        if (feature.graphic.attributes.IMAGE_DATE) {
            contentPro += "<span class='bold' title='Image Year'><b>Image Date: </b></span>{IMAGE_DATE}<br/>";
        }


        if (feature.graphic.attributes.Decade) {
            contentPro += "<span class='bold' title='Image Year'><b>Decade: </b></span>{Decade}<br/>";
        }


        if (feature.graphic.attributes.IMAGE_SCALE) {
            contentPro += "<span class='bold' title='Image Year'><b>Image Scale: </b></span>{IMAGE_SCALE}<br/>";
        }


        if (feature.graphic.attributes.Modifier) {
            contentPro += "<span class='bold' title='Image Year'><b>Data Category: </b></span>{DATA_CAT}<br/>";
        }


        if (feature.graphic.attributes.SUPPMAPINFO) {
            contentPro += "<span class='bold'><b>Supplemental Map Info: </b></span>" + "<a href='{SUPPMAPINFO}' target='_blank'>Opens in new tab</a>";
        } else {
            contentPro += "<span class='bold'><b>Supplemental Map Info: </b></span>Supplemental Map Info not currently available.";
        }

        return contentPro;
    }

    contentRipMeta = function(feature) {
        console.log("Rip Meta");
        var contentPro = "";


        if (feature.graphic.attributes.IMAGE_YR) {
            contentPro += "<span class='bold' title='Image Year'><b>Image Year: </b></span>{IMAGE_YR}<br/>";
        }


        if (feature.graphic.attributes.IMAGE_DATE) {
            contentPro += "<span class='bold' title='Image Year'><b>Image Date: </b></span>{IMAGE_DATE}<br/>";
        }


        if (feature.graphic.attributes.Decade) {
            contentPro += "<span class='bold' title='Image Year'><b>Decade: </b></span>{Decade}<br/>";
        }

        if (feature.graphic.attributes.DATA_SOURCE) {
            contentPro += "<span class='bold' title='Image Year'><b>Data Source: </b></span>{DATA_SOURCE}<br/>";
        }



        if (feature.graphic.attributes.SUPPMAPINFO) {
            contentPro += "<span class='bold'><b>Supplemental Map Info: </b></span>" + "<a href='{SUPPMAPINFO}' target='_blank'>Opens in new tab</a>";
        } else {
            contentPro += "<span class='bold'><b>Supplemental Map Info: </b></span>Supplemental Map Info not currently available.";
        }

        return contentPro;
    }

    contentType = function(feature) {
        var contentType = "";


        if (feature.graphic.attributes.ATTRIBUTE) {
            contentType += "<span class='bold' title='NWI Code'><b>Attribute: </b></span>{ATTRIBUTE}<br/>";
        }


        if (feature.graphic.attributes.WETLAND_TYPE) {
            contentType += "<span class='bold' title='Utah Type'><b>Wetland Type: </b></span>{WETLAND_TYPE}<br/>";
        }


        if (feature.graphic.attributes.ACRES) {
            var acresShort = feature.graphic.attributes.ACRES.toFixed(2);
            contentType += "<span class='bold' title='Acres'><b>Acres: </b></span>" + acresShort + "<br/>";
        }


        if (feature.graphic.attributes.System) {
            contentType += "<span class='bold' title='Utah Modification'><b>System: </b></span>{System}<br/>";
        }


        if (feature.graphic.attributes.Class) {
            contentType += "<span class='bold' title='Utah Use'><b>Class: </b></span>{Class}<br/>";
        }


        if (feature.graphic.attributes.Regime) {
            contentType += "<span class='bold' title='Utah Use'><b>Regime: </b></span>{Regime}<br/>";
        }


        if (feature.graphic.attributes.Modifier) {
            contentType += "<span class='bold' title='Utah Use'><b>Modifier: </b></span>{Modifier}<br/>";
        }

        return contentType;

    }

    contentRipType = function(feature) {
        console.log(feature);
        var contentType = "";


        if (feature.graphic.attributes.ATTRIBUTE) {
            contentType += "<span class='bold' title='NWI Code'><b>Attribute: </b></span>{ATTRIBUTE}<br/>";
        }


        if (feature.graphic.attributes.WETLAND_TYPE) {
            contentType += "<span class='bold' title='Utah Type'><b>Riparian Type: </b></span>{WETLAND_TYPE}<br/>";
        }


        if (feature.graphic.attributes.ACRES) {
            var acresShort = feature.graphic.attributes.ACRES.toFixed(2);
            contentType += "<span class='bold' title='Acres'><b>Acres: </b></span>" + acresShort + "<br/>";
        }


        if (feature.graphic.attributes.Description) {
            contentType += "<span class='bold' title='Utah Modification'><b>Description: </b></span>{Description}<br/>";
        }


        if (feature.graphic.attributes.System) {
            contentType += "<span class='bold' title='Utah Use'><b>System: </b></span>{System}<br/>";
        }


        if (feature.graphic.attributes.Class) {
            contentType += "<span class='bold' title='Utah Use'><b>Class: </b></span>{Class}<br/>";
        }


        if (feature.graphic.attributes.DominanceType) {
            contentType += "<span class='bold' title='Utah Use'><b>Dominance Type: </b></span>{DominanceType}<br/>";
        }


        return contentType;

    }


    contentStudyArea = function(feature) {
        var contentStudyArea = "";

        if (feature.graphic.attributes.project) {
            contentStudyArea += "<span class='bold' title='Name of project'><b>Project Name: </b></span>{project}<br/>";
        }
        if (feature.graphic.attributes.years) {
            contentStudyArea += "<span class='bold' title='Years when field work was conducted'><b>Years: </b></span>{years}<br/>";
        }

        if (feature.graphic.attributes.ProjectReport) {
            contentStudyArea += "<span class='bold' title='Link to final project report'><b>Report: </b></span>" + "<a href='{ProjectReport}' target='_blank'>Opens in new tab</a><br/>";
        } else {
            contentStudyArea += "<span class='bold'><b>Report: </b></span>Currently not available.<br/>";
        }
        if (feature.graphic.attributes.target_population) {
            contentStudyArea += "<span class='bold' title='Group of wetlands targeted for study by the project'><b>Target population: </b></span>{target_population}<br/>";
        }
        if (feature.graphic.attributes.target_population_comparison) {
            contentStudyArea += "<span class='bold' title='How target population compares to target in other UGS surveys'><b>Target population comparison: </b></span>{target_population_comparison}<br/>";
        }
        if (feature.graphic.attributes.sample_frame) {
            contentStudyArea += "<span class='bold' title='Spatial data used to select survey sites'><b>Sample frame: </b></span>{sample_frame}<br/>";
        }
        if (feature.graphic.attributes.site_selection) {
            contentStudyArea += "<span class='bold' title='Method used for selecting sites'><b>Site selection: </b></span>{site_selection}<br/>";
        }


        return contentStudyArea;

    }


    contentStudyResults = function(feature) {
        var contentStudyResults = "";

        if (feature.graphic.attributes.project) {
            contentStudyResults += "<span class='bold' title='Name of project'><b>Project Name: </b></span>{project}<br/>";
        }
        if (feature.graphic.attributes.stratum_name) {
            contentStudyResults += "<span class='bold' title='Name of stratum within project area'><b>Stratum Name: </b></span>{stratum_name}<br/>";
        }
        if (feature.graphic.attributes.stratum_ecoregion) {
            contentStudyResults += "<span class='bold' title='Ecoregion of stratum within project area'><b>Stratum Ecoregion: </b></span>{stratum_ecoregion}<br/>";
        }
        if (feature.graphic.attributes.sites_surveyed) {
            contentStudyResults += "<span class='bold' title='Number of sites surveyed'><b>Sites Surveyed (#): </b></span>{sites_surveyed}<br/>";
        }
        if (feature.graphic.attributes.pct_very_high_condition) {
            contentStudyResults += "<span class='bold' title='Percent of sites with very high condition score (URAP overall score ≥4.5)'><b>Very High Condition Score (%): </b></span>{pct_very_high_condition}<br/>";
        }
        if (feature.graphic.attributes.pct_high_condition) {
            contentStudyResults += "<span class='bold' title='Percent of sites with high condition score (URAP overall score ≥3.5 & <4.5)'><b>High Condition Score (%): </b></span>{pct_high_condition}<br/>";
        }
        if (feature.graphic.attributes.pct_medium_condition) {
            contentStudyResults += "<span class='bold' title='Percent of sites with medium condition score (URAP overall score ≥2.5 & <3.5)'><b>Medium Condition Score (%): </b></span>{pct_medium_condition}<br/>";
        }
        if (feature.graphic.attributes.pct_low_condition) {
            contentStudyResults += "<span class='bold' title='Percent of sites with high condition score (URAP overall score ≥3.5 & <4.5)'><b>Low Condition Score (%): </b></span>{pct_low_condition}<br/>";
        }
        if (feature.graphic.attributes.pct_high_condition) {
            contentStudyResults += "<span class='bold' title='Percent of sites with high condition score (URAP overall score ≥3.5 & <4.5)'><b>High Condition Score (%): </b></span>{pct_high_condition}<br/>";
        }
        if (feature.graphic.attributes.pct_absent_overall_stress) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having absent stressors'><b>Stressors Absent (%): </b></span>{pct_absent_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.pct_low_overall_stress) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having low stressors'><b>Stressors Low (%): </b></span>{pct_low_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.pct_med_overall_stress) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having medium stressors'><b>Stressors Medium (%): </b></span>{pct_med_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.pct_high_overall_stress) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having high stressors'><b>Stressors High (%): </b></span>{pct_high_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.pct_very_high_overall_stress) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having very high stressors'><b>Stressors Very High (%): </b></span>{pct_very_high_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.mean_rel_native_cov) {
            contentStudyResults += "<span class='bold' title='Mean across sites of percent cover of native plants divided by cover by all plants with known nativity'><b>Mean Relative Native Plant Cover (%): </b></span>{mean_rel_native_cov}<br/>";
        }
        if (feature.graphic.attributes.mean_abs_nox_cov) {
            contentStudyResults += "<span class='bold' title='Mean across sites of percent cover of noxious weed species'><b>Mean Absolute Noxious Plant Cover (%): </b></span>{mean_abs_nox_cov}<br/>";
        }


        return contentStudyResults;

    }



    contentSpecies = function(feature) {
        console.log(feature);
        var contentSpecies = "";

        objectID = feature.graphic.attributes.OBJECTID;

        var queryTask = new QueryTask({
            url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Dependent_Species/MapServer/1"
        });

        var relationQuery = new RelationshipQuery({
            objectIds: [objectID],
            outFields: ["OBJECTID", "Species", "Notes", "Status", "Known_elevation_range", "Habitat_Description", "Link_to_More_Information"],
            //returnGeometry: true,
            relationshipId: 0
        });

        //var idArray = [];

        queryTask.executeRelationshipQuery(relationQuery)
            .then(function(rslts) {
                console.log(rslts);
                var features = rslts[objectID].features;
                features.forEach(function(ftr) {
                    var t = ftr.attributes;
                    var species = t.Species;
                    contentSpecies += "<span class='bold' title='Species'><b><font size='3'><span class='uppercase'>" + species + "</span></font></b></span><br>";
                    var range = t.Known_elevation_range;
                    contentSpecies += "<span class='bold' title='Notes'><b>Known Elevation Range: </b></span>" + range + "<br/>";
                    var habitat = t.Habitat_Description;
                    contentSpecies += "<span class='bold' title='Status'><b>Habitat: </b></span>" + habitat + "<br/>";
                    // var notes = t.Notes;
                    // contentSpecies += "<span class='bold' title='Notes'><b>Notes: </b></span>" + notes + "<br/>";
                    // var status = t.Status;
                    // contentSpecies += "<span class='bold' title='Status'><b>Status: </b></span>" + status + "<br/>";
                    var url = t.Link_to_More_Information;
                    contentSpecies += "<span class='bold' id='more' title='Status'><b>More Info: </b></span> <a target='_blank' href='" + url + "'>Link</a><br/><br>";
                    //idArray.push(t.OBJECTID);

                });

                console.log(contentSpecies);


                var thetitle = contentTitle(feature);

                mapView.popup.open({
                    title: "Sensitive Amphibian Species " + thetitle,
                    content: contentSpecies,
                    outFields: ["*"]
                });
                //});

                //});

            })

    }


    contentTitle = function(feature) {
        console.log(feature);
        var contentTitle = "";
        var titleName = feature.graphic.attributes.NAME;
        contentTitle += "for " + titleName + " County";
        return contentTitle
    }

    //Add data

// var huc12 = new FeatureLayer({
// url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Landscape_Data/MapServer/0",
// title: "HUC 12",
// visible: false
// });

    var boundaryLayer = new MapImageLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Boundaries/MapServer",
        sublayers: [{
                id: 1,
                title: "River Basins",
                visible: true,
                labelsVisible: true,
                labelingInfo: [{
                    labelExpression: "[Name]",
                    labelPlacement: "always-horizontal",
                    symbol: {
                        type: "text", // autocasts as new TextSymbol()
                        color: [0, 92, 230],
                        haloColor: [255, 255, 255],
                        haloSize: 1,
                        font: {
                            size: 12,
                            weight: "bold",
                            style: "italic"
                        }
                    },
                    // minScale: 2400000,
                    maxScale: 1500001,
                }]
            },
            //maxScale: 1500001,
            {
                id: 2,
                title: "River Sub Basins",
                visible: true,
                minScale: 1500000,

            }
        ]
    });


    var wetlandLayer = new MapImageLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Mapping/MapServer",
        title: "Wetland Mapping",
        sublayers: [{
                id: 4,
                title: "Wetlands Outline",
                visible: false,
                popupTemplate: {
                    title: "Wetland Outlines",
                    content: contentType,
                    outFields: ["*"]
                },
            },
            {
                id: 3,
                title: "Riverine",
                visible: false,
                popupTemplate: {
                    title: "Riverine",
                    content: contentType,
                    outFields: ["*"]
                },

            },
            {
                id: 2,
                title: "Wetlands (non-riverine)",
                visible: true,
                popupTemplate: {
                    title: "Wetlands (non-riverine)",
                    content: contentType,
                    outFields: ["*"]
                },
                popupEnabled: true
            },
            {
                id: 1,
                title: "Wetland Metadata",
                visible: false,
                popupTemplate: {
                    title: "Wetland Metadata",
                    content: contentPro,
                    outFields: ["*"]
                },
                popupEnabled: true
            },

        ]
    });

    var speciesLayer = new MapImageLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Dependent_Species/MapServer",
        visible: false,
        sublayers: [{
                id: 1,
                title: "Sensitive amphibian species ",
                //visible: false,
                popupTemplate: {
                    title: "Sensitive Amphibian Species {NAME:contentTitle}",
                    content: contentSpecies,
                    outFields: ["*"]

                },
            }

        ]
    });

    var assessmentLayer = new FeatureLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer/0",
        visible: true,
                title: "Wetland Assessment Projects",
                opacity: 0.6,
                popupTemplate: {
                    title: "Wetland Assessment Projects",
                    content: contentStudyArea,
                    outFields: ["*"]
                },

    });

    var stressorsLayer = new FeatureLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer/1",
        visible: true,

                title: "Wetland Stressors",
                opacity: 0.6,


    });

    var studyResultsLayer = new FeatureLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer/2",

            
                title: "Wetland Assessment Study Results",
                opacity: 0.6,
                popupTemplate: {
                    title: "Wetland Assessment Study Results",
                    content: contentStudyResults,
                    outFields: ["*"]
                },
                visible: true

    });

    var ownershipLayer = new MapImageLayer({
        url: "https://gis.trustlands.utah.gov/server/rest/services/Ownership/UT_SITLA_Ownership_LandOwnership_WM/MapServer",
        visible: false,
        title: "Land Ownership",
        popupTemplate: {
            title: "Land Ownership",
            // content: contentOwnership
        },
        //opacity: 0.6,
    });

    var hydricSoils = new ImageryLayer({
        url: "https://utility.arcgis.com/usrsvcs/servers/1d5e9da46b4b4d9195cdd173586c5eb7/rest/services/USA_Soils_Hydric_Class/ImageServer",
        title: "Hydric Soils Classes",
        visible: false
    })

    var riparianData = new MapImageLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Riparian/MapServer",
        title: "Riparian Mapping",
        visible: false,
        sublayers: [{
                id: 0,
                title: "Riparian Metadata",
                popupTemplate: {
                    title: "Riparian Metadata",
                    content: contentRipMeta,
                    outFields: ["*"]
                },
            },
            {
                id: 1,
                title: "Riparian",
                popupTemplate: {
                    title: "Riparian Areas",
                    content: contentRipType,
                    outFields: ["*"]
                },
            },
        ]
    })

    // const huc12 = new FeatureLayer({
    //     title: "HUC12",
    //     url:
    //       "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Landscape_Data/MapServer/0",
    //     popupTemplate: {
    //       // autocast as esri/PopupTemplate
    //       title: "HUC12",
    //       content: [
    //         {
    //           type: "fields",
    //           fieldInfos: [
    //             {
    //               fieldName: "huc12_name",
    //               label: "Name",
    //             },
    //             {
    //               fieldName: "huc12",
    //               label: "HUC12 #",
    //             },
                
    //           ]
    //         }
    //       ]
    //     },
    //   });

    //   const huc12eco = new FeatureLayer({
    //     title: "HUC12 by Ecoregion",
    //     url:
    //       "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Landscape_Data/MapServer/1",
    //     popupTemplate: {
    //       // autocast as esri/PopupTemplate
    //       title: "HUC 12 by Ecoregion",
    //       content: [
    //         {
    //           type: "fields",
    //           fieldInfos: [
    //             {
    //               fieldName: "huc12_name",
    //               label: "Name",
    //             },
    //             {
    //               fieldName: "huc12",
    //               label: "HUC12 #",
    //             },
                
    //           ]
    //         }
    //       ]
    //     },
    //   });

    var conditionsGroup = new GroupLayer({
        title: "Wetland Conditions",
        visible: false,
        visibiltyMode: "independent",
        layers: [stressorsLayer, studyResultsLayer, assessmentLayer]
    })


    var wetlandGroup = new GroupLayer({
        title: "Wetland and Riparian Mapping",
        visible: true,
        visibiltyMode: "independent",
        layers: [riparianData, wetlandLayer]
    })

    var landscapeGroup = new GroupLayer({
        title: "Landscape Data",
        visible: false,
        visibiltyMode: "independent",
        layers: []
    })




    mapView.map.add(ownershipLayer);
    mapView.map.add(speciesLayer);
    mapView.map.add(conditionsGroup);
    mapView.map.add(hydricSoils);
    mapView.map.add(wetlandGroup);
    //mapView.map.add(wetlandLayer);
    mapView.map.add(boundaryLayer);
    mapView.map.add(landscapeGroup);


    ownershipLayer.opacity = .6;
    hydricSoils.opacity = .7;

    mapView.popup.watch(["selectedFeature"], function(g) {
        // event is the event handle returned after the event fires.
        mapView.graphics.remove(tempGraphic);

        if (g) {

            // var symbol = new SimpleFillSymbol({
            //     type: "simple-fill",
            //     style: "none",
            //     outline: { // autocasts as new SimpleLineSymbol()
            //         color: "cyan",
            //         width: 3
            //     }
            // });

            var symbol = {
                type: "simple-fill",
                style: "none",
                outline: { // autocasts as new SimpleLineSymbol()
                    color: "cyan",
                    width: 3
                }
            };

            tempGraphic = new Graphic({
                geometry: g.geometry,
                symbol: symbol
            });
            mapView.graphics.add(tempGraphic);

        }
    });




    layerList = new LayerList({
        view: mapView,
        container: "legendDiv",
        listItemCreatedFunction: function(event) {
            const item = event.item;
            if (item.layer.type != "group") { // don't show legend twice
            item.panel = {
                content: "legend",
                open: true
            }
            item.actionsSections = [
                [{
                    title: "Increase opacity",
                    className: "esri-icon-up",
                    id: "increase-opacity"
                }, {
                    title: "Decrease opacity",
                    className: "esri-icon-down",
                    id: "decrease-opacity"
                }]
            ];
        }
    }
    });

    //legend expand widget
    var expandLegend = new Expand({
        view: mapView,
        content: layerList,
        //group: "top-left",
        expandTooltip: "Expand Legend",
        expanded: false
    })

    //legend expand widget
    var legend = new Expand({
        view: mapView,
        content: layerList,
        //group: "top-left",
        expandTooltip: "Expand Legend",
        expanded: true
    })

    




    


    
            //load download geoprocessor
            var gp = new Geoprocessor(gpUrl);
                gp.outSpatialReference = { // autocasts as new SpatialReference()
                wkid: 102100
            };

    // SketchView functions
    mapView.when(function() {
        // create a new sketch view model
        const sketchViewModel = new SketchViewModel({
            view: mapView,
            layer: tempGraphicsLayer,
            polygonSymbol: {
                type: "simple-fill",
                color: [52, 229, 235, 0.8],
                outline: {
                  color: "gray",
                  width: 0
                }
              }
        });

        setUpClickHandler();

        // Listen to create event to add a newly created graphic to view
        sketchViewModel.on("create", addGraphic);

        // Listen the sketchViewModel's update-complete and update-cancel events
        sketchViewModel.on("update", updateGraphic);

        //*************************************************************
        // called when sketchViewModel's create-complete event is fired.
        //*************************************************************
        function addGraphic(event) {

            if (event.state === "complete") {
                
              
            // Create a new graphic and set its geometry to
            // `create-complete` event geometry.
            graphic = new Graphic({
                geometry: event.graphic.geometry,
                symbol: {
                    type: "simple-fill",
                    color: [52, 229, 235, 0.8],
                    outline: {
                      color: "gray",
                      width: 0
                    }
                  }
            });
            console.log("1228", graphic);
            console.log("1229", sketchViewModel);
            tempGraphicsLayer.add(graphic);
            mapView.map.layers.reorder(tempGraphicsLayer, 6);
        }
        }

        //***************************************************************
        // called when sketchViewModel's update-complete or update-cancel
        // events are fired.
        //*************************************************************
        function updateGraphic(event) {
            // event.graphic is the graphic that user clicked on and its geometry
            // has not been changed. Update its geometry and add it to the layer
            event.graphic.geometry = event.geometry;
            tempGraphicsLayer.add(event.graphic);

            // set the editGraphic to null update is complete or cancelled.
            editGraphic = null;
        }

        // ************************************************************************************
        // set up logic to handle geometry update and reflect the update on "tempGraphicsLayer"
        // ************************************************************************************
        function setUpClickHandler() {
            mapView.on("click", function(event) {
                console.log("Click Handler", event);
                mapView.hitTest(event).then(function(response) {
                    var results = response.results;
                    // Found a valid graphic
                    if (results.length && results[results.length - 1]
                        .graphic) {
                        // Check if we're already editing a graphic
                        if (!editGraphic) {
                            // Save a reference to the graphic we intend to update
                            editGraphic = results[results.length - 1].graphic;
                            // Remove the graphic from the GraphicsLayer
                            // Sketch will handle displaying the graphic while being updated
                            tempGraphicsLayer.remove(editGraphic);
                            sketchViewModel.update(editGraphic);
                        }
                    }
                });
            });
        }


        //***************************************
        // activate the sketch to create a polygon
        //***************************************
        var drawPolygonButton = document.getElementById("polygonButton");
        drawPolygonButton.onclick = function() {
            // set the sketch to create a polygon geometry
            sketchViewModel.create("polygon");
            setActiveButton(this);
        };


        //***************************************
        // activate the GP Download
        //***************************************
        var downloadButton = document.getElementById("DownloadButton");
        var modal = document.getElementById("myModal");
        var span = document.getElementsByClassName("close")[0];
        downloadButton.onclick = function() {
            modal.style.display = "block";
            // set the sketch to create a polygon geometry
            var inputGraphicContainer = [];
            inputGraphicContainer.push(graphic);
            var featureSet = new FeatureSet();
            featureSet.features = inputGraphicContainer;
            console.log("1294", inputGraphicContainer);
            console.log("1295", featureSet);
            console.log("1296", graphic);
            var params = {
                "Area_of_Interest": featureSet,
            };
            console.log("1301", params);

            gp.submitJob(params).then(function(jobInfo){


                var jobid = jobInfo.jobId;

                    var options = {
                        interval: 1500,
                        statusCallback: function(j) {
                        console.log("Job Status: ", j.jobStatus);
                        var waiting = j.jobStatus;
                        document.getElementsByClassName("modal-content")[0].innerHTML = '<b>Please wait while we process your file.</b> <br>';
                        }
                    };

                    gp.waitForJobCompletion(jobid, options).then(function(rslt) {

                        //function downloadFile(rslt) {
                            console.log("1306", rslt);
                            console.log(rslt.jobStatus);
                            var test1 = "https://webmaps.geology.utah.gov/arcgis/rest/directories/arcgisjobs/wetlands/wetlandsdownload_gpserver/" + rslt.jobId + "/scratch/wetlands_download.zip";

                            console.log("1319", test1);
                
                            document.getElementsByClassName("modal-content")[0].innerHTML = '<b><a href="' + test1 + '">Click to download your file.</a></b> <br>';
                
                
                            //modal.style.display = "block";
                        ///}
                        
                    });
                    modal.style.display = "block";     
             });

        };

    




        // When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
  }
  
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }




        //**************
        // reset button
        //**************
        document.getElementById("resetBtn").onclick = function() {
            //sketchViewModel.reset();
            tempGraphic = null;
            tempGraphicsLayer.removeAll();
            setActiveButton();
        };

        function setActiveButton(selectedButton) {
            // focus the view to activate keyboard shortcuts for sketching
            mapView.focus();
            var elements = document.getElementsByClassName("active");
            for (var i = 0; i < elements.length; i++) {
                elements[i].classList.remove("active");
            }
            if (selectedButton) {
                selectedButton.classList.add("active");
            }
        }
    });


    mapView.popup.dockOptions = {
        // Disable the dock button so users cannot undock the popup
        buttonEnabled: false,

    };




    // Basemap events
    query("#selectBasemapPanel").on("change", function(e) {
        console.log("base mapping");
        if (e.target.value == "Infrared") {

            mapView.map.basemap = irBase;
            // if mapview use basemaps defined in the value-vector=, but if mapview use value=
        } else if (map.mview == "map") {
            mapView.map.basemap = e.target.options[e.target.selectedIndex].dataset.vector;
        } else { // =="scene"
            mapView.map.basemap = e.target.value;
        }
    });

    function errorCallback(error) {
        console.log("error:", error);
    }

    //testing resizing grid

    var isResizing = false,
        lastDownX = 0;

    $(function() {
        var container = $('#cont');
        var top = $('mapViewDiv');
        var bottom = $('#gridDisplay');
        //var gridHeight = $('dgrid');
        var handle = $('#drag');

        handle.on('mousedown', function(e) {
            isResizing = true;
            lastDownX = e.clientY;
        });

        $(document).on('mousemove', function(e) {
            // we don't want to do anything if we aren't resizing.
            if (!isResizing)
                return;
            console.log("e.clientY ", e.clientY, container.offset().top)
            var offsetRight = container.height() - (e.clientY - container.offset().top);
            console.log(offsetRight);

            top.css('bottom', offsetRight);
            bottom.css('height', offsetRight);
            //gridHeight.css('height', offsetRight);

            let root = document.documentElement;

            root.addEventListener("mousemove", e => {
                root.style.setProperty('--gridHeight', offsetRight + "px");
            })

        }).on('mouseup', function(e) {
            // stop resizing
            isResizing = false;
        });
    });


    // check for mobile to expand legend

    isResponsiveSize = mapView.widthBreakpoint === "xsmall";
    updateView(isResponsiveSize);

    // Breakpoints

    mapView.watch("widthBreakpoint", function(breakpoint) {
        console.log("watching breakpoint");
        console.log(breakpoint);
        switch (breakpoint) {
            case "xsmall":
                updateView(true);
                break;
            case "small":
            case "medium":
            case "large":
            case "xlarge":
                updateView(false);
                break;
            default:
        }
    });

    function updateView(isMobile) {
        console.log("Is Mobile");
        setLegendMobile(isMobile);
    }


    function setLegendMobile(isMobile) {
        var toAdd = isMobile ? expandLegend : legend;
        var toRemove = isMobile ? legend : expandLegend;

        mapView.ui.remove(toRemove);
        mapView.ui.add(toAdd, "top-left");
    }

    
    watchUtils.watch(landscapeGroup, 'visible', function(e) {
        if (e == true) {

            
            //div.esri-ui-bottom-right.esri-ui-corner > div
            document.querySelector("#mapViewDiv > div.esri-view-root > div.esri-ui > div.esri-ui-inner-container.esri-ui-corner-container > div.esri-ui-bottom-right.esri-ui-corner > div").style.display="block";
            document.getElementById("fieldDiv").style.display="block"
            showHideCalcitePanels("#panelInfo", "#collapseInfo");
        }
        if (e == false) {
            document.querySelector("#mapViewDiv > div.esri-view-root > div.esri-ui > div.esri-ui-inner-container.esri-ui-corner-container > div.esri-ui-bottom-right.esri-ui-corner > div").style.display="none";
            document.getElementById("fieldDiv").style.display="none"
        };
    });






//landscape data widget



    // Generate a new renderer each time the user changes an input parameter
    mapView.when().then(function () {

      layerSelect = document.getElementById("layer-select");
      layerSelect.addEventListener("change", generateRenderer);

      fieldSelect = document.getElementById("field-select");
      fieldSelect.addEventListener("change", generateRenderer);

      classSelect = document.getElementById("classification-select");
      classSelect.addEventListener("change", generateRenderer);

      numClassesInput = document.getElementById("num-classes");
      numClassesInput.addEventListener("change", generateRenderer);

      watchUtils.whenFalseOnce(mapView, "updating", generateRenderer);
    });

    // Generate rounded arcade expression when user
    // selects a field name
    function getValueExpression(field) {
      console.log("field:", field);
      return "$feature." + field;
      //return "Round( ( $feature." + field + " / 100 ) * 100, 1)";
    }

    function resolveMetrics(){
        const selectedLayer = layerSelect.options[layerSelect.selectedIndex].value;
        const selectedLayerTitle = layerSelect.options[layerSelect.selectedIndex].text;
        console.log(selectedLayer);
        return new Promise(resolve => {
            var removed = $();
        if (selectedLayer == '0') {
            console.log("remove 0");

            var x = document.getElementById("field-select");

            if ($("#field-select option[value='surface_water_trend']").length == 0) {
                
                var option = document.createElement("option");
            option.value = "surface_water_trend";
            option.text = "Growing Season 30-Year Surface Water Trend";
            x.add(option);
        }
    
        if ($("#field-select option[value='surface_water_slope']").length == 0) {
            
            var option0 = document.createElement("option");
            option0.value = "surface_water_slope";
            option0.text = "Sen's Slope for Surface Water (ha/yr)";
            x.add(option0);
        }


            $("#field-select option[value=pct_wells_rising]").remove();
            $("#field-select option[value=pct_wells_falling]").remove();
            $("#field-select option[value=mean_falling_slope]").remove();
            $("#field-select option[value=mean_rising_slope]").remove();

    
    
        } else if (selectedLayer == '1') {
            console.log("remove 1");
            $("#field-select option[value=pct_wells_rising]").remove();
            $("#field-select option[value=pct_wells_falling]").remove();
            $("#field-select option[value=mean_falling_slope]").remove();
            $("#field-select option[value=mean_rising_slope]").remove();
            $("#field-select option[value=surface_water_trend]").remove();
            $("#field-select option[value=surface_water_slope]").remove();

        } else if (selectedLayer == '2') {
           
            console.log("remove 2");

            var x = document.getElementById("field-select");

            if ($("#field-select option[value='surface_water_trend']").length == 0) {
                
            var option = document.createElement("option");
        option.value = "surface_water_trend";
        option.text = "Growing Season 30-Year Surface Water Trend";
        x.add(option);
    }

    if ($("#field-select option[value='surface_water_slope']").length == 0) {
        
        var option0 = document.createElement("option");
        option0.value = "surface_water_slope";
        option0.text = "Sen's Slope for Surface Water (ha/yr)";
        x.add(option0);
    }

    if ($("#field-select option[value='pct_wells_rising']").length == 0) {
        
        var option1 = document.createElement("option");
        option1.value = "pct_wells_rising";
        option1.text = "Wells Rising (%)";
        x.add(option1);
    }

    if ($("#field-select option[value='pct_wells_falling']").length == 0) {
        
        var option2 = document.createElement("option");
        option2.value = "pct_wells_falling";
        option2.text = "Wells Falling (%)";
        x.add(option2);
    }

    if ($("#field-select option[value='mean_falling_slope']").length == 0) {
        
        var option3 = document.createElement("option");
        option3.value = "mean_falling_slope";
        option3.text = "Wells Falling Slope Mean";
        x.add(option3);
    }
    if ($("#field-select option[value='mean_rising_slope']").length == 0) {
        
        var option4 = document.createElement("option");
        option4.value = "mean_rising_slope";
        option4.text = "Wells Rising Slope Mean";
        x.add(option4);
    }
        

   

        } else if (selectedLayer == '3') {
            console.log("remove 3");
            $("#field-select option[value=pct_wells_rising]").remove();
            $("#field-select option[value=pct_wells_falling]").remove();
            $("#field-select option[value=mean_falling_slope]").remove();
            $("#field-select option[value=mean_rising_slope]").remove();
            $("#field-select option[value=surface_water_trend]").remove();
            $("#field-select option[value=surface_water_slope]").remove();

        } else if (selectedLayer == '4') {
            console.log("remove 4");
            $("#field-select option[value=pct_wells_rising]").remove();
            $("#field-select option[value=pct_wells_falling]").remove();
            $("#field-select option[value=mean_falling_slope]").remove();
            $("#field-select option[value=mean_rising_slope]").remove();
            $("#field-select option[value=surface_water_trend]").remove();
            $("#field-select option[value=surface_water_slope]").remove();

   }
   var metric = fieldSelect.options[fieldSelect.selectedIndex].text;
   resolve(metric);
});
}

    async function generateRenderer() {
        //remove existing layers from the landscape data group
        landscapeGroup.layers.removeAll();

      //grab values from element for field choice
      const selectedLayer = layerSelect.options[layerSelect.selectedIndex].value;
      const selectedLayerTitle = layerSelect.options[layerSelect.selectedIndex].text;
      console.log(selectedLayer);
      var fieldLabel = await resolveMetrics();
      
      //fieldSelect.options[fieldSelect.selectedIndex].text;
      console.log(fieldLabel);


      if (selectedLayer == '0') {
    
        landscapeLayer = new FeatureLayer({
           title: "Watershed (HUC12)",
         url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Landscape_Data/MapServer/" + selectedLayer,
             popupTemplate: {
           title: "Watershed (HUC12)",
           content: contentHUC12,
           outFields: ["*"]
         },
       });
     } else if (selectedLayer == '1') {


       var landscapeLayer = new FeatureLayer({
           title: "Watershed (HUC12) by Ecoregion",
         url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Landscape_Data/MapServer/" + selectedLayer,
             popupTemplate: {
           // autocast as esri/PopupTemplate
           title: "Watershed (HUC12) by Ecoregion",
           content: contentHUC12,
           outFields: ["*"]
         },
       });
   } else if (selectedLayer == '2') {
       var x = document.getElementById("field-select");


       var landscapeLayer = new FeatureLayer({
           title: "Sub-Basin (HUC8)",
         url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Landscape_Data/MapServer/" + selectedLayer,
             popupTemplate: {
           // autocast as esri/PopupTemplate
           title: "Sub-Basin (HUC8)",
           content: contentHUC8,
           outFields: ["*"]
         },
       });
   } else if (selectedLayer == '3') {

       var landscapeLayer = new FeatureLayer({
           title: "Sub-Basin (HUC8) by Ecoregion",
         url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Landscape_Data/MapServer/" + selectedLayer,
             popupTemplate: {
           // autocast as esri/PopupTemplate
           title: "Sub-Basin (HUC8) by Ecoregion",
           content: contentHUC8,
           outFields: ["*"]
         },
       });
   } else if (selectedLayer == '4') {


       var landscapeLayer = new FeatureLayer({
           title: "Ecoregion",
         url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Landscape_Data/MapServer/" + selectedLayer,
             popupTemplate: {
           // autocast as esri/PopupTemplate
           title: "Ecoregion",
           content: [
             {
               type: "fields",
               fieldInfos: [
                   {
                       fieldName: "ecoregion",
                       label: "Ecoregion:",
                     },
                 
               ]
             }
           ]
         },
       });
}



        


      landscapeGroup.layers.push(landscapeLayer);


      
      // default to natural-breaks when manual is selected for classification method
      const classificationMethod =
        classSelect.value === "manual"
          ? "natural-breaks"
          : classSelect.value;

      const params = {
        layer: landscapeLayer,
        //valueExpression: getValueExpression(fieldValue),
        field: fieldSelect.options[fieldSelect.selectedIndex].value,
        view: mapView,
        classificationMethod: classificationMethod,
        numClasses: parseInt(numClassesInput.value),
        legendOptions: {
          title: fieldLabel
        },
        defaultLabel: "No Data"
      };

      if (fieldSelect.options[fieldSelect.selectedIndex].value == "surface_water_trend") {
          console.log("Trending");
          let rendererTrend = {
            type: "unique-value",  // autocasts as new UniqueValueRenderer()
            field: "surface_water_trend",
            //defaultSymbol: { type: "simple-fill" },  // autocasts as new SimpleFillSymbol()
            //defaultLabel: "No Data",
            uniqueValueInfos: [{
              // All features with value of "North" will be blue
              value: "2",
              label: "Decreasing",
              symbol: {
                type: "simple-fill",  // autocasts as new SimpleFillSymbol()
                color: "red"
              }
            }, {
              // All features with value of "East" will be green
              value: "3",
              label: "Increasing",
              symbol: {
                type: "simple-fill",  // autocasts as new SimpleFillSymbol()
                color: "blue"
              }
            }, {
              // All features with value of "South" will be red
              value: "1",
              label: "No Trend",
              symbol: {
                type: "simple-fill",  // autocasts as new SimpleFillSymbol()
                color: "beige"
              }
            }, {
              // All features with value of "West" will be yellow
              value: "0",
              label: "No data",
              symbol: {
                type: "simple-fill",  // autocasts as new SimpleFillSymbol()
                color: "0, 255, 0, 0"
              }
            }],
          };
          landscapeLayer.renderer = rendererTrend;
          if (!landscapeGroup.layers.includes(landscapeLayer)) {
            //map.add(huc12);
            landscapeGroup.layers.push(landscapeLayer);
          }
      } else {

      // generate the renderer and set it on the layer
      colorRendererCreator
        .createClassBreaksRenderer(params)
        .then(function (rendererResponse) {
            landscapeLayer.renderer = rendererResponse.renderer;

          if (!landscapeGroup.layers.includes(landscapeLayer)) {
            //map.add(huc12);
            landscapeGroup.layers.push(landscapeLayer);
          }

          if (classSelect.value === "manual") {
            // if manual is selected, then add or update
            // a classed color slider to allow the user to
            // construct manual class breaks
            console.log("manual breaks")
            updateColorSlider(rendererResponse);
          } else {
            destroySlider();
          }
        });
    }

    // If manual classification method is selected, then create
    // a classed color slider to allow user to manually modify
    // the class breaks starting with the generated renderer

    function updateColorSlider(rendererResult) {
      console.log("Custom", fieldSelect);
      const fieldValue =
      fieldSelect.options[fieldSelect.selectedIndex].value;
        //fieldSelect.selectedItems[0].id;
      histogram({
        layer: landscapeLayer,
        valueExpression: getValueExpression(fieldValue),
        field: fieldValue,
        view: mapView,
        numBins: 100
      }).then(function (histogramResult) {
        console.log(histogramResult);
        if (!slider) {
          const sliderContainer = document.createElement("div");
          const container = document.createElement("div");
          container.id = "containerDiv";
          container.appendChild(sliderContainer);
          mapView.ui.add(container, "top-right");

          slider = ClassedColorSlider.fromRendererResult(
            rendererResult,
            histogramResult
          );
          slider.container = container;
          slider.viewModel.precision = 1;

          function changeEventHandler() {
            const renderer = landscapeLayer.renderer.clone();
            renderer.classBreakInfos = slider.updateClassBreakInfos(
              renderer.classBreakInfos
              
            );
            console.log(renderer.classBreakInfos);
            landscapeLayer.renderer = renderer;
          }

          slider.on(
            ["thumb-change", "thumb-drag", "min-change", "max-change"],
            changeEventHandler
          );
        } else {
          slider.updateFromRendererResult(rendererResult, histogramResult);
          console.log(rendererResult);
          console.log(histogramResult);
        }
      });
    }
}

    function destroySlider() {
      if (slider) {
        let container = document.getElementById("containerDiv");
        mapView.ui.remove(container);
        slider.container = null;
        slider = null;
        container = null;
      }
    }



    //Event listener that fires each time an action is triggered
    layerList.on("trigger-action", function(event) {

        // Capture the action id.
        var id = event.action.id;

        var title = event.item.title;

        if (title === "Riparian Mapping") {
            layer = riparianData;
        } else if (title === "River Sub Basins") {
            layer = boundaryLayer;
        } else if (title === "River Basins") {
            layer = boundaryLayer;
        } else if (title === "Wetland Mapping") {
            layer = wetlandLayer;
        } else if (title === "Watershed (HUC12)") {
            layer = landscapeLayer;
        } else if (title === "Surface Ownership and Administration") {
            layer = ownershipLayer;
        }



        if (id === "increase-opacity") {
            console.log("increase opacity");
            // if the increase-opacity action is triggered, then
            // increase the opacity of the GroupLayer by 0.25

            if (layer.opacity < 1) {
                layer.opacity += 0.1;
            }
        } else if (id === "decrease-opacity") {
            console.log("decrease opacity");
            // if the decrease-opacity action is triggered, then
            // decrease the opacity of the GroupLayer by 0.25

            if (layer.opacity > 0) {
                layer.opacity -= 0.1;
            }
        }
    });

    async function fillMetrics() {
       
    }



});