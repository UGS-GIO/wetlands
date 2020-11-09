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
], function(Map, MapView, SimpleMarkerSymbol, GraphicsLayer, ImageryLayer, RasterFunction, Basemap, BasemapGallery, LocalBasemapsSource, SketchViewModel, Sketch, Graphic, GroupLayer, Geoprocessor, FeatureSet, FeatureLayer, MapImageLayer, Query, QueryTask, Home, ScaleBar, Zoom, Compass, Search, Legend, Expand, LayerList, BasemapToggle, watchUtils, RelationshipQuery, AttachmentsContent, Collapse, Dropdown, query, Memory, ObjectStore, ItemFileReadStore, DataGrid, OnDemandGrid, ColumnHider, Selection, StoreAdapter, List, declare, parser, aspect, request, mouse, CalciteMaps, CalciteMapArcGISSupport, on, arrayUtils, dom, domClass, domConstruct) {

    var gpUrl ="https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/WetlandsDownload/GPServer/ExtractWetlandsData";


            var tempGraphic = null;          
            let editGraphic;
            // GraphicsLayer to hold graphics created via sketch view model
            const tempGraphicsLayer = new GraphicsLayer({
                listMode: "hide",
            });


           

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




    var scaleBar = new ScaleBar({
        view: mapView,
        unit: "dual" // The scale bar displays both metric and non-metric units.
    });

    // Add the widget to the bottom left corner of the view
    mapView.ui.add(scaleBar, {
        position: "bottom-left"
    });

    mapView.map.add(tempGraphicsLayer);

    //Create popup content
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


        if (feature.graphic.attributes.IMAGE_SCALE) {
            contentPro += "<span class='bold' title='Image Year'><b>Image Scale: </b></span>{IMAGE_SCALE}<br/>";
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

        if (feature.graphic.attributes.region) {
            contentStudyArea += "<span class='bold' title='Region'><b>Region: </b></span>{region}<br/>";
        }
        if (feature.graphic.attributes.years) {
            contentStudyArea += "<span class='bold' title='Years'><b>Years: </b></span>{years}<br/>";
        }

        if (feature.graphic.attributes.ProjectReport) {
            contentStudyArea += "<span class='bold'><b>Project Report: </b></span>" + "<a href='{ProjectReport}' target='_blank'>Opens in new tab</a>";
        } else {
            contentStudyArea += "<span class='bold'><b>Project Report: </b></span>Currently not available.";
        }


        return contentStudyArea;

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

    var conditionsLayer = new MapImageLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer",
        visible: false,
        sublayers: [{
                id: 2,
                title: "Wetland Stressors",
                opacity: 0.6,
                //visible: false,

            },
            {
                id: 1,
                title: "Wetland Assessment Projects",
                opacity: 0.6,
                popupTemplate: {
                    title: "Wetland Assessment Projects",
                    content: contentStudyArea,
                    outFields: ["*"]
                },
                //visible: false
            },
        ]
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

    var wetlandGroup = new GroupLayer({
        title: "Wetland and Riparian Mapping",
        visible: true,
        visibiltyMode: "independent",
        layers: [riparianData, wetlandLayer]
    })




    mapView.map.add(ownershipLayer);
    mapView.map.add(speciesLayer);
    mapView.map.add(conditionsLayer);
    mapView.map.add(hydricSoils);
    mapView.map.add(wetlandGroup);
    //mapView.map.add(wetlandLayer);
    mapView.map.add(boundaryLayer);


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
            item.panel = {
                content: "legend",
                //open: true
            };
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

    //Event listener that fires each time an action is triggered
    layerList.on("trigger-action", function(event) {

        // Capture the action id.
        var id = event.action.id;

        var title = event.item.title;

        if (title === "Wetland and Riparian Mapping") {
            layer = wetlandLayer;
        } else if (title === "Boundaries") {
            layer = boundaryLayer;
        } else if (title === "Wetland Dependent Species") {
            layer = speciesLayer;
        } else {
            layer = hydricSoils;
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




    


    
            //load download geoprocessor
            var gp = new Geoprocessor(gpUrl);
                gp.outSpatialReference = { // autocasts as new SpatialReference()
                wkid: 102100
            };

    // SketchView functions
    mapView.when(function() {
        console.log("Sketching");
        // create a new sketch view model
        const sketchViewModel = new SketchViewModel({
            view: mapView,
            layer: tempGraphicsLayer,
            polygonSymbol: {
                type: "simple-fill", // autocasts as new SimpleFillSymbol()
                color: "rgba(138,43,226, 0.8)",
                style: "solid",
                outline: {
                    color: "white",
                    width: 1
                }
            }
        });

        setUpClickHandler();

        // Listen to create-complete event to add a newly created graphic to view
        sketchViewModel.on("create", addGraphic);

        // Listen the sketchViewModel's update-complete and update-cancel events
        sketchViewModel.on("update-complete", updateGraphic);
        sketchViewModel.on("update-cancel", updateGraphic);

        //*************************************************************
        // called when sketchViewModel's create-complete event is fired.
        //*************************************************************
        function addGraphic(event) {
            console.log("Add Graphic");
            // Create a new graphic and set its geometry to
            // `create-complete` event geometry.
            graphic = new Graphic({
                geometry: event.geometry,
                symbol: {
                    type: "simple-fill", // autocasts as new SimpleFillSymbol()
                    color: "rgba(138,43,226, 0.8)",
                    style: "solid",
                    outline: {
                        color: "white",
                        width: 1
                    }
                }
            });
            console.log(graphic);
            tempGraphicsLayer.add(graphic);
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
        downloadButton.onclick = function() {
            // set the sketch to create a polygon geometry
            var inputGraphicContainer = [];
            inputGraphicContainer.push(graphic);
            var featureSet = new FeatureSet();
            featureSet.features = inputGraphicContainer;
            console.log(inputGraphicContainer);
            console.log(featureSet);
            console.log(graphic);
            var params = {
                "Area_of_Interest": featureSet,
            };

            gp.submitJob(params).then(poop);

            function poop(rslt) {
                console.log(rslt);
                var test1 = "https://webmaps.geology.utah.gov/arcgis/rest/directories/arcgisjobs/wetlands/wetlandsdownload_gpserver/" + rslt.jobId + "/scratch/wetlands_download.zip";
                var downloadFrame = document.createElement("iframe");
                console.log(downloadFrame);
                downloadFrame.setAttribute('src', test1);
                downloadFrame.setAttribute('class', "screenReaderText");
                document.body.appendChild(downloadFrame);
                console.log(test1);
            }
        };




        //**************
        // reset button
        //**************
        document.getElementById("resetBtn").onclick = function() {
            sketchViewModel.reset();
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


});