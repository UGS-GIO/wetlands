require([
    // ArcGIS
    "esri/Map",
    "esri/views/MapView",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
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
    "esri/rest/geoprocessor",
    "esri/rest/support/FeatureSet",
    "esri/smartMapping/renderers/color",
    "esri/smartMapping/statistics/histogram",
    "esri/widgets/smartMapping/ClassedColorSlider",
    //Layers
    "esri/layers/FeatureLayer",
    "esri/layers/MapImageLayer",
    //Tasks  
    "esri/rest/support/Query",
    "esri/rest/query",
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
    "esri/core/reactiveUtils",
    "esri/rest/support/RelationshipQuery",
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
    "calcite-maps/calcitemaps-v0.10",

    // Calcite Maps ArcGIS Support
    "calcite-maps/calcitemaps-arcgis-support-v0.10",
    "dojo/on",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/domReady!"
], function(Map, MapView, SimpleMarkerSymbol, SimpleFillSymbol, GraphicsLayer, ImageryLayer, RasterFunction, Basemap, BasemapGallery, LocalBasemapsSource, SketchViewModel, Sketch, Graphic, GroupLayer, geoprocessor, FeatureSet, colorRendererCreator, histogram, ClassedColorSlider, FeatureLayer, MapImageLayer, Query, QueryTask, Home, ScaleBar, Zoom, Compass, Search, Locate, Legend, Expand, LayerList, BasemapToggle, reactiveUtils, RelationshipQuery, AttachmentsContent, Collapse, Dropdown, query, Memory, ObjectStore, ItemFileReadStore, DataGrid, OnDemandGrid, ColumnHider, Selection, StoreAdapter, List, declare, parser, aspect, request, mouse, CalciteMaps, CalciteMapArcGISSupport, on, arrayUtils, dom, domClass, domConstruct) {

    var gpUrl ="https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/WetlandsDownload/GPServer/ExtractWetlandsData";
    var tempGraphic = null;          
            let editGraphic;
            // GraphicsLayer to hold graphics created via sketch view model
            const tempGraphicsLayer = new GraphicsLayer({
                listMode: "hide",
            });

    //variables for landscape data
    let layerSelect, fieldSelect, classSelect, numClassesInput, slider;

    let objectid;


           

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
        basemaps: [Basemap.fromId("hybrid"), Basemap.fromId("streets-vector"), Basemap.fromId("gray-vector"), irBase]
    });

    //grid vars
    let grid;
    let dataStore = new StoreAdapter({
        objectStore: new Memory({
            idProperty: "OBJECTID"
        })
    });

    const gridDis = document.getElementById("gridDisplay");

    var resultsAction = {
        title: "Study Results",
        id: "study-results",
        className: "esri-icon-table"
    };

    var projectsAction = {
        title: "Project Table",
        id: "project-table",
        className: "esri-icon-table"
    };

    // Map
    var map = new Map({
        basemap: "hybrid",
        //layers: [plantSites, ecoRegions],
        //ground: "world-elevation",
    });

    // View
    var mapView = new MapView({
        popup: {
            dockEnabled: true,
            dockOptions: {
              // Disables the dock button from the popup
              buttonEnabled: false,
              // Ignore the default sizes that trigger responsive docking
              breakpoint: false
            }
          },
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

    modal = document.getElementById("myModal");


  
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

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

    contentTitle = function(feature) {
        console.log(feature);
        var contentTitle = "";
        var titleName = feature.graphic.attributes.NAME;
        contentTitle += "for " + titleName + " County";
        return contentTitle
    }

    contentHUC12 = function(feature) {
        console.log(feature);
        var contentHUC12 = "";


        if (feature.graphic.attributes.huc12_name) {
            contentHUC12 += "<span class='bold' title=''><b>Watershed Name: </b></span>{huc12_name}<br/>";
        }


        if (feature.graphic.attributes.huc12) {
            contentHUC12 += "<span class='bold' title=''><b>Watershed Identifier: </b></span>{huc12}<br/>";
        }

        if (feature.graphic.attributes.ecoregion) {
            contentHUC12 += "<span class='bold' title=''><b>Ecoregion: </b></span>{ecoregion}<br/>";
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

        if (feature.graphic.attributes.ecoregion) {
            contentHUC8 += "<span class='bold' title=''><b>Ecoregion: </b></span>{ecoregion}<br/>";
        }
        if (feature.graphic.attributes.surface_water_plot) {
            contentHUC8 += "<span class='bold'><b>Surface Water Plot: </b></span>" + "<a href='{surface_water_plot}' target='_blank'>Opens in new tab</a>";
        } else {
            contentHUC8 += "<span class='bold'><b>Surface Water Plot: </b></span>Surface Water Plot not currently available.";
        }

        return contentHUC8;
    }

    contentEcoregion = function(feature) {
        console.log(feature);
        var contentEcoregion = "";
        if (feature.graphic.attributes.ecoregion) {
            contentEcoregion += "<span class='bold' title=''><b>Ecoregion: </b></span>{ecoregion}<br/>";
        }
        return contentEcoregion;
    }

    contentPro = function(feature) {

        var contentPro = "";
        console.log(feature);



        if (feature.graphic.attributes.IMAGE_YR) {
            contentPro += "<span class='bold' title='Year of imagery used in mapping'><b>Image Year: </b></span>{IMAGE_YR}<br/>";
        }


        if (feature.graphic.attributes.IMAGE_DATE && feature.graphic.attributes.IMAGE_DATE != "<Null>") {
            contentPro += "<span class='bold' title='Date of imagery used in mapping'><b>Image Date: </b></span>{IMAGE_DATE}<br/>";
        }


        if (feature.graphic.attributes.DECADE) {
            contentPro += "<span class='bold' title='Decade of imagery used in mapping'><b>Image Decade: </b></span>{DECADE}<br/>";
        }


        if (feature.graphic.attributes.ALL_SCALES && feature.graphic.attributes.ALL_SCALES != "<Null>") {
            contentPro += "<span class='bold' title='Scale of imagery using in mapping'><b>Image Scale: </b></span>{ALL_SCALES}<br/>";
        }


        if (feature.graphic.attributes.DATA_SOURCE) {
            contentPro += "<span class='bold' title='Mapping organization'><b>Data Source: </b></span>{DATA_SOURCE}<br/>";
        }


        if (feature.graphic.attributes.SUPPMAPINFO == "None") {
            contentPro += "<span class='bold' title='Link to supplemental mapping report'><b>Supplemental Map Info: </b></span>Supplemental Map Info not currently available.";
        }   else {
            contentPro += "<span class='bold' title='Link to supplemental mapping report'><b>Supplemental Map Info: </b></span>" + "<a href='{SUPPMAPINFO}' target='_blank'>Opens in new tab</a>";
        }

        return contentPro;
    }

    contentRipMeta = function(feature) {
        console.log("Rip Meta");
        var contentPro = "";



        if (feature.graphic.attributes.IMAGE_YR) {
            contentPro += "<span class='bold' title='Year of imagery used in mapping'><b>Image Year: </b></span>{IMAGE_YR}<br/>";
        }


        if (feature.graphic.attributes.IMAGE_DATE) {
            contentPro += "<span class='bold' title='Date of imagery used in mapping'><b>Image Date: </b></span>{IMAGE_DATE}<br/>";
        }


        if (feature.graphic.attributes.DECADE) {
            contentPro += "<span class='bold' title='Decade of imagery used in mapping'><b>Image Decade: </b></span>{DECADE}<br/>";
        }


        if (feature.graphic.attributes.ALL_SCALES) {
            contentPro += "<span class='bold' title='Scale of imagery using in mapping'><b>Image Scale: </b></span>{ALL_SCALES}<br/>";
        }


        if (feature.graphic.attributes.DATA_SOURCE) {
            contentPro += "<span class='bold' title='Mapping organization'><b>Data Source: </b></span>{DATA_SOURCE}<br/>";
        }


        if (feature.graphic.attributes.SUPPMAPINFO == "None") {
            contentPro += "<span class='bold' title='Link to supplemental mapping report'><b>Supplemental Map Info: </b></span>Supplemental Map Info not currently available.";
        }   else {
            contentPro += "<span class='bold' title='Link to supplemental mapping report'><b>Supplemental Map Info: </b></span>" + "<a href='{SUPPMAPINFO}' target='_blank'>Opens in new tab</a>";
        }

        return contentPro;
    }

    contentType = function(feature) {
        var contentType = "";


        if (feature.graphic.attributes.ATTRIBUTE) {
            contentType += "<span class='bold' title='Coded value describing wetland with Cowardin system'><b>Cowardin Attribute: </b></span>" + feature.graphic.attributes.ATTRIBUTE + "<br/>";
        }


        if (feature.graphic.attributes.WETLAND_TYPE) {
            contentType += "<span class='bold' title='Wetland type'><b>Wetland Type: </b></span>" + feature.graphic.attributes.WETLAND_TYPE + "<br/>";
        }


        if (feature.graphic.attributes.ACRES) {
            var acOG = feature.graphic.attributes.ACRES;
            var acresShort = acOG.toFixed(2);
            contentType += "<span class='bold' title='Acres'><b>Acres: </b></span>" + acresShort + "<br/>";
        }

        if (feature.graphic.attributes.IMAGE_YR) {
            contentType += "<span class='bold' title='Year of imagery used in mapping'><b>Image Year: </b></span>" + feature.graphic.attributes.IMAGE_YR + "<br/>";
        }

        if (feature.graphic.attributes.LLWW) {
            contentType += "<span class='bold' title='If yes, turn on the Additional Attributes layer to view the LLWW attributes'><b>Additional Attributes Available: </b></span>" + feature.graphic.attributes.LLWW + "<br/>";
        }

        //contentType += "<br><span>Visit the <a href='https://fwsprimary.wim.usgs.gov/decoders/wetlands.aspx' target='_blank'>Wetlands Code Interpreter</a> for help interpreting the Cowardin Attribute Code.</span>";


        // if (feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.system_name']) {
        //     contentType += "<span class='bold' title='Utah Modification'><b>System: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.system_name'] + "<br/>";
        // }


        // if (feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.class_name']) {
        //     contentType += "<span class='bold' title='Utah Use'><b>Class: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.class_name'] + "<br/>";
        // }


        // if (feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.water_regime_name']) {
        //     contentType += "<span class='bold' title='Utah Use'><b>Regime: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.water_regime_name'] + "<br/>";
        // }


        // if (feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.modifier1_name']) {
        //     contentType += "<span class='bold' title='Utah Use'><b>Modifier: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.modifier1_name'] + "<br/>";
        // }

        return contentType;

    }


//////////////////////////////////////////////////FOR USGS DATA///////////////////////////////////////////////////////////
    // contentType = function(feature) {
    //     var contentType = "";


    //     if (feature.graphic.attributes['agstest.sdeadmin.Wetlands_2.attribute']) {
    //         contentType += "<span class='bold' title='NWI Code'><b>Attribute: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.Wetlands_2.attribute'] + "<br/>";
    //     }


    //     if (feature.graphic.attributes['agstest.sdeadmin.Wetlands_2.wetland_type']) {
    //         contentType += "<span class='bold' title='Utah Type'><b>Wetland Type: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.Wetlands_2.wetland_type'] + "<br/>";
    //     }


    //     if (feature.graphic.attributes['agstest.sdeadmin.Wetlands_2.acres']) {
    //         var acOG = feature.graphic.attributes['agstest.sdeadmin.Wetlands_2.acres'];
    //         var acresShort = acOG.toFixed(2);
    //         contentType += "<span class='bold' title='Acres'><b>Acres: </b></span>" + acresShort + "<br/>";
    //     }


    //     if (feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.system_name']) {
    //         contentType += "<span class='bold' title='Utah Modification'><b>System: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.system_name'] + "<br/>";
    //     }


    //     if (feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.class_name']) {
    //         contentType += "<span class='bold' title='Utah Use'><b>Class: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.class_name'] + "<br/>";
    //     }


    //     if (feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.water_regime_name']) {
    //         contentType += "<span class='bold' title='Utah Use'><b>Regime: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.water_regime_name'] + "<br/>";
    //     }


    //     if (feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.modifier1_name']) {
    //         contentType += "<span class='bold' title='Utah Use'><b>Modifier: </b></span>" + feature.graphic.attributes['agstest.sdeadmin.NWI_Wetland_Codes.modifier1_name'] + "<br/>";
    //     }

    //     return contentType;

    // }

    contentRipType = function(feature) {
        console.log(feature);
        var contentType = "";


        if (feature.graphic.attributes.ATTRIBUTE) {
            contentType += "<span class='bold' title='NWI Code'><b>Attribute: </b></span>{ATTRIBUTE}<br/>";
        }


        if (feature.graphic.attributes.WETLAND_TYPE) {
            contentType += "<span class='bold' title='Riparian Type'><b>Riparian Type: </b></span>{WETLAND_TYPE}<br/>";
        }


        if (feature.graphic.attributes.ACRES) {
            var acresShort = feature.graphic.attributes.ACRES.toFixed(2);
            contentType += "<span class='bold' title='Acres'><b>Acres: </b></span>" + acresShort + "<br/>";
        }

        if (feature.graphic.attributes.IMAGE_YR) {
            contentType += "<span class='bold' title='Year of imagery used in mapping'><b>Image Year: </b></span>" + feature.graphic.attributes.IMAGE_YR + "<br/>";
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
        console.log(feature)
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
        if (feature.graphic.attributes.pct_very_high_condition || feature.graphic.attributes.pct_very_high_condition == 0) {
            contentStudyResults += "<span class='bold' title='Percent of sites with very high condition score (URAP overall score ≥4.5)'><b>Very High Condition Score (%): </b></span>{pct_very_high_condition}<br/>";
        }
        if (feature.graphic.attributes.pct_high_condition || feature.graphic.attributes.pct_high_condition == 0) {
            contentStudyResults += "<span class='bold' title='Percent of sites with high condition score (URAP overall score ≥3.5 & <4.5)'><b>High Condition Score (%): </b></span>{pct_high_condition}<br/>";
        }
        if (feature.graphic.attributes.pct_medium_condition || feature.graphic.attributes.pct_medium_condition == 0) {
            contentStudyResults += "<span class='bold' title='Percent of sites with medium condition score (URAP overall score ≥2.5 & <3.5)'><b>Medium Condition Score (%): </b></span>{pct_medium_condition}<br/>";
        }
        if (feature.graphic.attributes.pct_low_condition || feature.graphic.attributes.pct_low_condition == 0) {
            contentStudyResults += "<span class='bold' title='Percent of sites with high condition score (URAP overall score ≥3.5 & <4.5)'><b>Low Condition Score (%): </b></span>{pct_low_condition}<br/>";
        }
        if (feature.graphic.attributes.pct_absent_overall_stress || feature.graphic.attributes.pct_absent_overall_stress == 0) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having absent stressors'><b>Stressors Absent (%): </b></span>{pct_absent_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.pct_low_overall_stress || feature.graphic.attributes.pct_low_overall_stress == 0) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having low stressors'><b>Stressors Low (%): </b></span>{pct_low_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.pct_med_overall_stress || feature.graphic.attributes.pct_med_overall_stress == 0) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having medium stressors'><b>Stressors Medium (%): </b></span>{pct_med_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.pct_high_overall_stress || feature.graphic.attributes.pct_high_overall_stress == 0) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having high stressors'><b>Stressors High (%): </b></span>{pct_high_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.pct_very_high_overall_stress || feature.graphic.attributes.pct_very_high_overall_stress == 0) {
            contentStudyResults += "<span class='bold' title='Percent of sites rated as having very high stressors'><b>Stressors Very High (%): </b></span>{pct_very_high_overall_stress}<br/>";
        }
        if (feature.graphic.attributes.mean_rel_native_cov || feature.graphic.attributes.mean_rel_native_cov == 0) {
            contentStudyResults += "<span class='bold' title='Mean across sites of percent cover of native plants divided by cover by all plants with known nativity'><b>Mean Relative Native Plant Cover (%): </b></span>{mean_rel_native_cov}<br/>";
        }
        if (feature.graphic.attributes.mean_abs_nox_cov || feature.graphic.attributes.mean_abs_nox_cov == 0) {
            contentStudyResults += "<span class='bold' title='Mean across sites of percent cover of noxious weed species'><b>Mean Absolute Noxious Plant Cover (%): </b></span>{mean_abs_nox_cov}<br/>";
        }


        return contentStudyResults;

    }

    contentLLWWDescriptions = function(feature) {
        console.log(feature)
        var content = "";

        if (feature.graphic.attributes.cowattribute) {
            content += "<span class='bold' title='NWI Attribute'><b>Cowardin Attribute: </b></span>{cowattribute}<br/>";
        }
        if (feature.graphic.attributes.featuretype) {
            content += "<span class='bold' title='LLWW Feature Type'><b>LLWW Feature Type: </b></span>{featuretype}<br/>";
        }

        if (feature.graphic.attributes.hgm_class) {
            content += "<span class='bold' title='HGM Class'><b>HGM Class: </b></span>{hgm_class}<br/>";
        } 
        if (feature.graphic.attributes.landscape) {
            content += "<span class='bold' title='Landscape Position'><b>Landscape: </b></span>{landscape}<br/>";
        }
        if (feature.graphic.attributes.landform_waterbody) {
            content += "<span class='bold' title='Wetland Landform or Waterbody Type'><b>Landform or Waterbody: </b></span>{landform_waterbody}<br/>";
        }
        if (feature.graphic.attributes.flowpath) {
            content += "<span class='bold' title='Water Flowpath'><b>Flowpath: </b></span>{flowpath}<br/>";
        }
        if (feature.graphic.attributes.llww_base) {
            content += "<span class='bold' title='LLWW Base Code'><b>LLWW Base Code: </b></span>{llww_base}<br/>";
        }
        if (feature.graphic.attributes.llww_modifiers) {
            content += "<span class='bold' title='LLWW Modifiers'><b>LLWW Modifiers: </b></span>{llww_modifiers}<br/>";
        }


        return content;

    }

    contentLLWWAreas = function(feature) {
        console.log(feature)
        var content = "";

        if (feature.graphic.attributes.projectname) {
            content += "<span class='bold' title='Mapping Area'><b>Project Name: </b></span>{projectname}<br/>";
        }
        if (feature.graphic.attributes.organization) {
            content += "<span class='bold' title='Mapped By'><b>Organization: </b></span>{organization}<br/>";
        }

        if (feature.graphic.attributes.baseimagery) {
            content += "<span class='bold' title='Source Imagery and Date'><b>Base Imagery: </b></span>{baseimagery}<br/>";
        } 
        if (feature.graphic.attributes.report) {
            content += "<span class='bold' title='Additional Information'><b>Supplemental Report: </b></span>" + "<a href='{report}' target='_blank'>Opens in new tab</a><br/>";
        }


        return content;

    }


    contentSpecies = function(feature) {
        var contentSpecies = "";
        objectID = feature.graphic.attributes.OBJECTID;

        var speciesSpecs = {
            outFields: ["OBJECTID", "Species", "Notes", "Status", "Known_elevation_range", "Habitat_Description", "Link_to_More_Information"],
            relationshipId: 0,
            objectIds: [objectID]
        }

        speciesLayer.queryRelatedFeatures(speciesSpecs)
            .then(function (rslts) {
                var features = rslts[objectID].features;
                features.forEach(function(ftr) {
                    var t = ftr.attributes;
                    var species = t.Species;
                    contentSpecies += "<span class='bold' title='Species'><b><font size='3'><span class='uppercase'>" + species + "</span></font></b></span><br>";
                    var range = t.Known_elevation_range;
                    contentSpecies += "<span class='bold' title='Notes'><b>Known Elevation Range: </b></span>" + range + "<br/>";
                    var habitat = t.Habitat_Description;
                    contentSpecies += "<span class='bold' title='Status'><b>Habitat: </b></span>" + habitat + "<br/>";
                    var url = t.Link_to_More_Information;
                    contentSpecies += "<span class='bold' id='more' title='Status'><b>More Info: </b></span> <a target='_blank' href='" + url + "'>Link</a><br/><br>";
                })

                var thetitle = contentTitle(feature);

                mapView.popup.open({
                    title: "Sensitive Amphibian Species " + thetitle,
                    content: contentSpecies,
                    outFields: ["*"],
                    visibleElements: {featureNaviagtion: true, closeButton: true}
                })
            })
    }




 // create grid
 function createGrid(fields) {
    console.log("creating grid");
    console.log(fields);
    console.log(gridFields);



    var columns = fields.filter(function(field, i) {
        if (gridFields.indexOf(field.name) >= -1) {
            return field;
        }
    }).map(function(field) {
        //console.log(field);
 if
         (field.name == "OBJECTID") {
            console.log("HIDE COLUMN " + field.name);
            return {
                field: field.name,
                label: field.alias,
                //sortable: true,
                hidden: true
            };
        } else {
            console.log("SHOW COLUMN");
            return {
                field: field.name,
                label: field.alias,
                sortable: true
            };
        }


    });

    console.log(columns);

    // create a new onDemandGrid with its selection and columnhider
    // extensions. Set the columns of the grid to display attributes
    // the hurricanes cvslayer
    grid = new(declare([OnDemandGrid, Selection]))({
        selectionMode: 'single',
        columns: columns
    }, "grid");

    // add a row-click listener on the grid. This will be used
    // to highlight the corresponding feature on the view
    grid.on("dgrid-select", selectFeatureFromGrid);
    console.log(grid.columns[0].field);
    grid.clearSelection();
}

//select from grid function
function selectFeatureFromGrid(event) {
    console.log(event);
    mapView.popup.close();
    mapView.graphics.removeAll();
    var row = event.rows[0];
    console.log(row);
    var id = row.data.OBJECTID;
    console.log(id);
    console.log(layer);

    if (layer.title == "Wetland Assessment Projects") {
        var query = assessmentLayer.createQuery();
        query.where = "OBJECTID = " + id;
              
                assessmentLayer.queryFeatures(query).then(function(results) {
                    console.log(results);
                    var graphics = results.features;
                    console.log(graphics);

                    var item = graphics[0];
                        var cntr = [];
                        cntr.push(item.geometry.extent.center.longitude);
                        cntr.push(item.geometry.extent.center.latitude);
                        console.log(item.geometry);
                        mapView.goTo({
                            center: cntr, // position:
                            zoom: 9
                        });
                        //mapView.graphics.removeAll();
                        // var selectedGraphic = new Graphic({
                        //     geometry: item.geometry,
                        //     symbol: new SimpleFillSymbol({
                        //         //color: [0,255,255],
                        //         style: "none",
                        //         //size: "8px",
                        //         outline: {
                        //             color: [255, 255, 0],
                        //             width: 3
                        //         }
                        //     })
                        // });
                        // mapView.graphics.add(selectedGraphic);
                        mapView.popup.open({
                            features: [item],
                            location: cntr
                        });
                })
    } else if (layer.title == "Wetland Assessment Study Results") {
        var query = studyResultsLayer.createQuery();
        query.where = "OBJECTID = " + id;
                       
                        studyResultsLayer.queryFeatures(query).then(function(results) {
                            console.log(results);
                            var graphics = results.features;
                            console.log(graphics);
                            var item = graphics[0];
                            var cntr = [];
                            cntr.push(item.geometry.extent.center.longitude);
                            cntr.push(item.geometry.extent.center.latitude);
                            console.log(item.geometry);
                            mapView.goTo({
                                center: cntr, // position:
                                zoom: 9
                            });
                            //mapView.graphics.removeAll();
                            // var selectedGraphic = new Graphic({
                            //     geometry: item.geometry,
                            //     symbol: new SimpleFillSymbol({
                            //         //color: [0,255,255],
                            //         style: "none",
                            //         //size: "8px",
                            //         outline: {
                            //             color: [255, 255, 0],
                            //             width: 3
                            //         }
                            //     })
                            // });
                            //     mapView.graphics.add(selectedGraphic);
                                mapView.popup.open({
                                    features: [item],
                                    location: cntr
                                });
                        })

    }

}

// riparian renderer

let ripRenderer = {
    type: "simple",  
    //defaultSymbol: { type: "simple-fill" },  // autocasts as new SimpleFillSymbol()
    // legendOptions: {
    //     title: "Wetland Type"
    //   },
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(245, 40, 145, 0.8)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }

  };

// wetlands metadata renderer

let wetMetaRenderer = {
    type: "unique-value",  // autocasts as new UniqueValueRenderer()
    field: "DECADE",
    defaultLabel: "Unknown",
    defaultSymbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "rgba(204, 204, 204, 255)",
          outline: {  // autocasts as new SimpleLineSymbol()
              width: "0px"
            }
        },
    //defaultSymbol: { type: "simple-fill" },  // autocasts as new SimpleFillSymbol()
    legendOptions: {
        title: "Decade"
      },
    uniqueValueInfos: [{

      value: "1980s",
      label: "1980s",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(194, 82, 60, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {

      value: "1990s",
      label: "1990s",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(247, 219, 7, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "South" will be red
      value: "2000s",
      label: "2000s",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(14, 196, 69, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {

      value: "2010s",
      label: "2010s",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(11, 44, 122, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
      },{

        value: "2020s",
        label: "2020s",
        symbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "rgba(153, 0, 255, 255)",
          outline: {  // autocasts as new SimpleLineSymbol()
              width: "0px"
            }
        }
      }],

  };

  // riparian metadata renderer

let ripMetaRenderer = {
    type: "unique-value",  // autocasts as new UniqueValueRenderer()
    field: "DECADE",
    defaultLabel: "Unknown",
    defaultSymbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "rgba(204, 204, 204, 255)",
          outline: {  // autocasts as new SimpleLineSymbol()
              width: "0px"
            }
        },
    //defaultSymbol: { type: "simple-fill" },  // autocasts as new SimpleFillSymbol()
    legendOptions: {
        title: "Decade"
      },
    uniqueValueInfos: [ {
      // All features with value of "South" will be red
      value: "2000s",
      label: "2000s",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(14, 196, 69, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {

      value: "2010s",
      label: "2010s",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(11, 44, 122, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
      },{

        value: "2020s",
        label: "2020s",
        symbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "rgba(153, 0, 255, 255)",
          outline: {  // autocasts as new SimpleLineSymbol()
              width: "0px"
            }
        }
      }],

  };

// wetlands renderer

let nonRiverineRenderer = {
    type: "unique-value",  // autocasts as new UniqueValueRenderer()
    field: "WETLAND_TYPE",
    //defaultSymbol: { type: "simple-fill" },  // autocasts as new SimpleFillSymbol()
    legendOptions: {
        title: "Wetland Type"
      },
    uniqueValueInfos: [{
      // All features with value of "North" will be blue
      value: "Freshwater Emergent Wetland",
      label: "Freshwater Emergent Wetland",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(180, 215, 158, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "East" will be green
      value: "Freshwater Forested/Shrub Wetland",
      label: "Freshwater Forested/Shrub Wetland",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(255, 211, 127, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "South" will be red
      value: "Freshwater Pond",
      label: "Freshwater Pond",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(190, 232, 255, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "West" will be yellow
      value: "Lake",
      label: "Lake",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(115, 178, 255, 255)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }],
    // visualVariables: [{
    //   type: "opacity",
    //   field: "POPULATION",
    //   normalizationField: "SQ_KM",
    //   // features with 30 ppl/sq km or below are assigned the first opacity value
    //   stops: [{ value: 100, opacity: 0.15 },
    //           { value: 1000, opacity: 0.90 }]
    // }]
  };


// stressors renderer

let stressorsRenderer = {
    type: "unique-value",  // autocasts as new UniqueValueRenderer()
    field: "gridcode",
    //defaultSymbol: { type: "simple-fill" },  // autocasts as new SimpleFillSymbol()
    legendOptions: {
        title: "Stress Level"
      },
    uniqueValueInfos: [{
      // All features with value of "North" will be blue
      value: "0",
      label: "None",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "#0070FF",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "East" will be green
      value: "1",
      label: "Low",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "#3AFF00",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "South" will be red
      value: "2",
      label: "Moderate",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "#FFAA00",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "West" will be yellow
      value: "3",
      label: "High",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "#FF0000",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }],
    // visualVariables: [{
    //   type: "opacity",
    //   field: "POPULATION",
    //   normalizationField: "SQ_KM",
    //   // features with 30 ppl/sq km or below are assigned the first opacity value
    //   stops: [{ value: 100, opacity: 0.15 },
    //           { value: 1000, opacity: 0.90 }]
    // }]
  };


  // llww mapping renderer

const sym0 = {
    type: 'simple-fill',
    color: "#002673",
    style: 'solid',
    outline: { color: 'gray', width: 0.3}
};

const sym1 = {
    type: 'simple-fill',
    color: "#00c3ff",
    style: 'solid',
    outline: { color: 'gray', width: 0.3}
};

const sym2 = {
    type: 'simple-fill',
    color: "#00a884",
    style: 'solid',
    outline: { color: 'gray', width: 0.3}
};

const sym3 = {
    type: 'simple-fill',
    color: "#de73ff",
    style: 'solid',
    outline: { color: 'gray', width: 0.3}
};

const sym4 = {
    type: 'simple-fill',
    color: "#ffff73",
    style: 'solid',
    outline: { color: 'gray', width: 0.3}
};

const sym5 = {
    type: 'simple-fill',
    color: "#e69900",
    style: 'solid',
    outline: { color: 'gray', width: 0.3}
};

const sym6 = {
    type: 'simple-fill',
    style: 'backward-diagonal',
    color: "#000000",
    outline: { color: 'gray', width: 0.3}
};

const sym7 = {
    type: 'simple-fill',
    style: 'solid',
    color: "#ffecbe",
    outline: { color: 'gray', width: 0.3}
};



const lName = "$feature.landform_waterbody";
//console.log(${lName});
const lType = "$feature.hgm_class";
//console.log(${lType});
const llwwRenderer = {
    type: "unique-value",
    valueExpression: `When(${lName} == 'RV1', 0, ${lName} == 'ST2', 0, ${lName} == 'ST3', 0, ${lName} == 'ST4', 0, ${lName} == 'ST5', 0, ${lName} == 'PD', 1, ${lName} == 'LK', 1, ${lName} == 'BA' && ${lType} == 'Riverine', 2, ${lName} == 'FP' && ${lType} == 'Riverine', 2, ${lName} == 'FR' && ${lType} == 'Riverine', 2, ${lName} == 'BA' && ${lType} == 'Lacustrine Fringe', 3, ${lName} == 'FP' && ${lType} == 'Lacustrine Fringe', 3, ${lName} == 'FR' && ${lType} == 'Lacustrine Fringe', 3, ${lName} == 'SL' && ${lType} == 'Slope', 4, ${lName} == 'BA' && ${lType} == 'Depressional', 5, ${lName} == 'FR' && ${lType} == 'Depressional', 5, ${lName} == 'FL' && ${lType} == 'Flats', 7, 6)`,
  
    uniqueValueInfos: [
    {
        value: "0",
        label: "Rivers, Streams, Canals",
        symbol: sym0  
    }, {
        value: "1",
        label: "Lakes and Ponds",
        symbol: sym1 
    },{
        value: "2",
        label: "Riverine Wetland",
        symbol: sym2 
    }, {
        value: "3",
        label: "Lacustrine Fringe Wetland",
        symbol: sym3 
    }, {
        value: "4",
        label: "Slope Wetland",
        symbol: sym4
    }, {
        value: "5",
        label: "Depressional Wetland",
        symbol: sym5
    }, {
        value: "6",
        label: "Riparian",
        symbol: sym6
    }, {
        value: "7",
        label: "Flats Wetland",
        symbol: sym7
    }
    ] 
};


//   let llwwRenderer = {
//     type: "unique-value",
//     field: "hgm_class",
//     field2: "landform_waterbody",
//     legendOptions: {
//         title: "HGM Class"
//     },
//     uniqueValueInfos: [{
//         value: "RV1, ST2, ST3, ST4, ST5",
//         label: "Rivers, Streams, Canals",
//         symbol: {
//           type: "simple-fill",  // autocasts as new SimpleFillSymbol()
//           color: "#002673",
//           outline: {  // autocasts as new SimpleLineSymbol()
//               width: "0px"
//             }
//         }
//       }, {
//         value: "PD, LK",
//         label: "Lakes and Ponds",
//         symbol: {
//           type: "simple-fill",  // autocasts as new SimpleFillSymbol()
//           color: "#0070FF",
//           outline: {  // autocasts as new SimpleLineSymbol()
//               width: "0px"
//             }
//         }
//       },

//     ]
//   }

  // wetland assessment projects renderer

let assRenderer = {
    type: "unique-value",  // autocasts as new UniqueValueRenderer()
    field: "project",
    //defaultSymbol: { type: "simple-fill" },  // autocasts as new SimpleFillSymbol()
    legendOptions: {
        title: "Project Name"
      },
    uniqueValueInfos: [{
      // All features with value of "North" will be blue
      value: "Bear River URAP",
      label: "Bear River URAP",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(228, 26, 28, 0.8)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "East" will be green
      value: "Jordan URAP",
      label: "Jordan URAP",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(55, 126, 184, 0.8)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "South" will be red
      value: "Uinta 2014",
      label: "Uinta 2014",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(77, 175, 74, 0.8)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
      }
    }, {
      // All features with value of "West" will be yellow
      value: "Weber URAP",
      label: "Weber URAP",
      symbol: {
        type: "simple-fill",  // autocasts as new SimpleFillSymbol()
        color: "rgba(152, 78, 163, 0.8)",
        outline: {  // autocasts as new SimpleLineSymbol()
            width: "0px"
          }
        }
      }, {
        // All features with value of "South" will be red
        value: "GSL URAP",
        label: "Great Salt Lake URAP",
        symbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "rgba(255, 255, 51, 0.9)",
          outline: {  // autocasts as new SimpleLineSymbol()
              width: "0px"
            }
        }
      }, {
        // All features with value of "South" will be red
        value: "SV URAP",
        label: "Snake Valley URAP",
        symbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "rgba(240, 2, 127, 0.9)",
          outline: {  // autocasts as new SimpleLineSymbol()
              width: "0px"
            }
        }
      }, {
        // All features with value of "South" will be red
        value: "Central Basin",
        label: "Central Basin",
        symbol: {
          type: "simple-fill",  // autocasts as new SimpleFillSymbol()
          color: "rgba(166, 86, 40, 0.7)",
          outline: {  // autocasts as new SimpleLineSymbol()
              width: "0px"
            }
        }
      
    }],
    // visualVariables: [{
    //   type: "opacity",
    //   field: "POPULATION",
    //   normalizationField: "SQ_KM",
    //   // features with 30 ppl/sq km or below are assigned the first opacity value
    //   stops: [{ value: 100, opacity: 0.15 },
    //           { value: 1000, opacity: 0.90 }]
    // }]
  };


    //define layers

    var speciesLayer = new FeatureLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Dependent_Species/MapServer/1",
        visible: true,
        title: "Sensitive amphibian species",
        popupTemplate: {
            title:  "Sensitive Amphibian Species {NAME:contentTitle}",
            content: contentSpecies,
            outFields: ["*"]
        }
    });



    var assessmentLayer = new FeatureLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer/0",
        visible: true,
        renderer: assRenderer,
                title: "Wetland Assessment Projects",
                blendMode: "multiply",
                //opacity: 0.6,
                popupTemplate: {
                    title: "Wetland Assessment Projects",
                    content: contentStudyArea,
                    actions: [resultsAction],
                    outFields: ["*"]
                },

    });

    var stressorsLayer = new FeatureLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer/1",
        renderer: stressorsRenderer,
        visible: false,

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
                    actions: [projectsAction],
                    outFields: ["*"]
                },
                visible: false

    });

    var ownershipLayer = new MapImageLayer({
        url: "https://gis.trustlands.utah.gov/mapping/rest/services/Land_Ownership_WM/MapServer",
        visible: false,
        title: "Land Ownership",
        listMode: "hide-children",
        popupTemplate: {
            title: "Land Ownership",
            // content: contentOwnership
        },
        //opacity: 0.6,
    });

    var hydricSoils = new ImageryLayer({
        url: "https://utility.arcgis.com/usrsvcs/servers/771b11ef2a574ce9a3a2351b758498fa/rest/services/USA_Soils_Hydric_Class/ImageServer",
        title: "Hydric Soils Classes",
        visible: false
    })
var ripMeta = new FeatureLayer({
        //url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Riparian/MapServer/0",
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/RiparianMappingtest27June23/MapServer/0",
        visible: false,
        title: "Riparian Project Information",
        renderer: ripMetaRenderer,
        popupTemplate: {
                title: "Riparian Project Information",
                content: contentRipMeta,
                outFields: ["*"]
        },
    })    
    var ripData = new FeatureLayer({
        //url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Riparian/MapServer/1",
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/RiparianMappingtest27June23/MapServer/1",
        title: "Riparian Mapping",
        visible: true,
        renderer: ripRenderer,
        popupTemplate: {
                title: "Riparian Mapping",
                //content: contentRipType,
                content: contentRipType,
                outFields: ["*"]
        },
    })

    var riverine = new FeatureLayer({
        //url: "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0",
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/WetlandMappingTest27June23/MapServer/3",
        title: "Riverine",
        //definitionExpression: "agstest.sdeadmin.Wetlands_2.wetland_type = 'Riverine'",
        //maxScale: 10000,
        //minScale: 500000,
        visible: false,
                popupTemplate: {
                    title: "Riverine",
                    content: contentType,
                    outFields: ["*"]
                },
    })

    var wetNonRiverine = new FeatureLayer({
        //url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Mapping/MapServer/2",
        //url: "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0",
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/WetlandMappingTest27June23/MapServer/2",
        title: "Wetlands (non-riverine)",
        renderer: nonRiverineRenderer,
        //definitionExpression: "agstest.sdeadmin.Wetlands_2.wetland_type <> 'Riverine'",
        //minScale: 500000,
        //maxScale: 10000,
        labelsVisible: false,
        visible: true,
                popupTemplate: {
                    title: "Wetlands (non-riverine)",
                    content: contentType,
                    outFields: ["*"]
                }

    })

    var wetMeta = new FeatureLayer({
        //url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Mapping/MapServer/1",
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/WetlandMappingTest27June23/MapServer/1",
        title: "Wetland Project Information",
        renderer: wetMetaRenderer,
        visible: false,
                popupTemplate: {
                    title: "Wetland Project Information",
                    content: contentPro,
                    outFields: ["*"]
                },
    })


////////////////////////////////////////////////USGS DATA??????????????/////////////////////////////////////////////////////////
    // var riverine = new FeatureLayer({
    //     url: "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0",
    //     title: "Riverine",
    //     definitionExpression: "agstest.sdeadmin.Wetlands_2.wetland_type = 'Riverine'",
    //     //maxScale: 10000,
    //     //minScale: 500000,
    //     visible: false,
    //             popupTemplate: {
    //                 title: "Riverine",
    //                 content: contentType,
    //                 outFields: ["*"]
    //             },
    // })

    // var wetNonRiverine = new FeatureLayer({
    //     //url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Mapping/MapServer/2",
    //     url: "https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0",
    //     title: "Wetlands (non-riverine)",
    //     definitionExpression: "agstest.sdeadmin.Wetlands_2.wetland_type <> 'Riverine'",
    //     //minScale: 500000,
    //     //maxScale: 10000,
    //     labelsVisible: false,
    //     visible: true,
    //             popupTemplate: {
    //                 title: "Wetlands (non-riverine)",
    //                 content: contentType,
    //                 outFields: ["*"]
    //             }

    // })



    var llwwMapping =  new FeatureLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/LLWW_Additional_Attributes/MapServer/0",
        title: "LLWW Descriptions",
        visible: true,
        renderer: llwwRenderer,
        popupTemplate: {
            title: "LLWW Descriptions",
            content: contentLLWWDescriptions,
            outFields: ["*"]
        }
    })

    var cacheProjectsArea =  new FeatureLayer({
        url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/LLWW_Additional_Attributes/MapServer/1",
        title: "LLWW Mapping Areas",
        visible: true,
        popupTemplate: {
            title: "LLWW Mapping Areas",
            content: contentLLWWAreas,
            outFields: ["*"]
        }

    })


    var additonalGroup = new GroupLayer({
        title: "Additional Attributes (LLWW)",
        visible: false,
        visibiltyMode: "independent",
        layers: [cacheProjectsArea, llwwMapping]
    })

    var ripGroup = new GroupLayer({
        title: "Riparian Data",
        visible: false,
        visibiltyMode: "independent",
        layers: [ripData, ripMeta]
    })

    var wetGroup = new GroupLayer({
        title: "Wetland Mapping",
        visible: true,
        visibiltyMode: "independent",
        layers: [riverine, wetNonRiverine, wetMeta]
    })

    var conditionsGroup = new GroupLayer({
        title: "Wetland Condition",
        visible: false,
        visibiltyMode: "independent",
        layers: [stressorsLayer, studyResultsLayer, assessmentLayer]
    })


    var wetlandGroup = new GroupLayer({
        title: "Wetland and Riparian Mapping",
        visible: true,
        visibiltyMode: "independent",
        layers: [additonalGroup, ripGroup, wetGroup]
    })

    var landscapeGroup = new GroupLayer({
        title: "Landscape Data",
        visible: false,
        visibiltyMode: "independent",
        layers: []
    })

    var speciesGroup = new GroupLayer({
        title: "Wetland Dependent Species",
        visible: false,
        visibiltyMode: "independent",
        layers: [speciesLayer]
    })






    mapView.map.add(ownershipLayer);
    //mapView.map.add(speciesGroup);
    mapView.map.add(conditionsGroup);
    mapView.map.add(landscapeGroup);
    mapView.map.add(hydricSoils);
    mapView.map.add(wetlandGroup);
      


    ownershipLayer.opacity = .6;
    hydricSoils.opacity = .7;




    function getResults(response) {
      
        console.log("getResults");
        console.log(response);
        console.log(response.fields);
        let testField = response.fields[0].name;
        console.log(testField);
        let graphics = response.features;
        console.log(graphics);
        //console.log(sitesCount);

        gridDis.style.display = 'block';
        domClass.add("mapViewDiv");
        //console.log("counting");
            // if (testField == "project") {
            //     document.getElementById("featureCount").innerHTML = "<b>Showing attributes for " + graphics.length.toString() + " results</b>"
                            document.getElementById("removeX").setAttribute("class", "glyphicon glyphicon-remove");
            document.getElementById("removeX").setAttribute("style", "float: right;");
            // } 

console.log("go on and create grid");

        createGrid(response.fields);
        console.log(response.fields);
        console.log(graphics);
        console.log(graphics[0].attributes);
        if (graphics[0].attributes) {
            console.log("has attributes");
            // get the attributes to display in the grid
            var data = graphics.map(function(feature, i) {
                return Object.keys(feature.attributes)
                    .filter(function(key) {
                        // get fields that exist in the grid
                        return (gridFields.indexOf(key) !== -1);
                    })
                    // need to create key value pairs from the feature
                    // attributes so that info can be displayed in the grid
                    .reduce((obj, key) => {
                        obj[key] = feature.attributes[key];
                        return obj;
                    }, {});
            });
            console.log(data);

        } else {
            console.log("no attributes");
            var data = graphics;

        }
        console.log(dataStore);
        // set the datastore for the grid using the
        // attributes we got for the query results
        dataStore.objectStore.data = data;
        console.log(dataStore.objectStore.data);
        grid.set("collection", dataStore);

        //document.getElementById("downloadX").setAttribute("class", "glyphicon glyphicon-download-alt");

    }

    function doGridClear() {
        console.log("doGridClear");
            if (grid) {
                dataStore.objectStore.data = {};
                grid.set("collection", dataStore);
            }
        gridDis.style.display = 'none';
        //document.getElementById("featureCount2").innerHTML = "";
        domClass.remove("mapViewDiv", 'withGrid');
    }



    function doQueryResults() {
        objectid = mapView.popup.viewModel.selectedFeature.attributes.OBJECTID;
        doGridClear();
        mapView.graphics.removeAll()
        console.log("doQueryResults");

        gridFields = ["OBJECTID", "project", "stratum_name", "stratum_ecoregion", "sites_surveyed", "pct_very_high_condition", "pct_high_condition",
            "pct_medium_condition", "pct_low_condition", "pct_absent_overall_stress", "pct_low_overall_stress", "pct_med_overall_stress",
             "pct_high_overall_stress", "pct_very_high_overall_stress", "mean_rel_native_cov", "mean_abs_nox_cov"
        ];

        // var queryResults = new query({
        //     url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer/0" //assesmentLayer
        // });
        console.log(objectid);

        relationQueryResults = {
            objectIds: [objectid],
            outFields: ["OBJECTID", "project", "stratum_name", "stratum_ecoregion", "sites_surveyed", "pct_very_high_condition", "pct_high_condition",
            "pct_medium_condition", "pct_low_condition", "pct_absent_overall_stress", "pct_low_overall_stress", "pct_med_overall_stress",
             "pct_high_overall_stress", "pct_very_high_overall_stress", "mean_rel_native_cov", "mean_abs_nox_cov"],
            relationshipId: 0
        };

        assessmentLayer.queryRelatedFeatures(relationQueryResults).then(function(rslts) {
            console.log(rslts);
            

            var poop = rslts[objectid];
            console.log(poop);
            if (poop) {

            var gridFieldArray = [
                //{alias: 'OBJECTID', name: 'OBJECTID'}, 
                {
                    alias: 'Project',
                    name: 'project'
                },
                {
                    alias: 'Stratum Name',
                    name: 'stratum_name'
                },
                {
                    alias: 'Stratum Ecoregion',
                    name: 'stratum_ecoregion'
                },
                {
                    alias: 'Sites Surveyed (#)',
                    name: 'sites_surveyed'
                },
                {
                    alias: 'Very High Condition Score (%)',
                    name: 'pct_very_high_condition'
                },
                {
                    alias: 'High Condition Score (%)',
                    name: 'pct_high_condition'
                },
                {
                    alias: 'Medium Condition Score (%)',
                    name: 'pct_medium_condition'
                },
                {
                    alias: 'Low Condition Score (%)',
                    name: 'pct_low_condition'
                },
                {
                    alias: 'Stressors Absent (%)',
                    name: 'pct_absent_overall_stress'
                },
                {
                    alias: 'Stressors Low (%)',
                    name: 'pct_low_overall_stress'
                },
                {
                    alias: 'Stressors Medium (%)',
                    name: 'pct_med_overall_stress'
                },
                {
                    alias: 'Stressors High (%)',
                    name: 'pct_high_overall_stress'
                },
                {
                    alias: 'Stressors Very High (%)',
                    name: 'pct_very_high_overall_stress'
                },
                {
                    alias: 'Mean Relative Native Plant Cover (%)',
                    name: 'mean_rel_native_cov'
                },
                {
                    alias: 'Mean Absolute Noxious Plant Cover (%)',
                    name: 'mean_abs_nox_cov'
                },
            ];

            poop.fields = gridFieldArray;

            // poop.fields.forEach(function(fields, i) {
            //     fields.name = gridFields[i]
            //     fields.alias = gridFieldArray[i]
            // });

            console.log(poop);
            console.log(rslts);
            getResults(rslts[objectid]);

        } else {
            console.log("No Table");
                modal.style.display = "block";
                document.getElementsByClassName("modal-content")[0].innerHTML = '<b>No feature table for this layer.</b> <br>';  
        }

        });

       

    }


    function doQueryStudyAllResults() {

        doGridClear();
        mapView.graphics.removeAll()
        console.log("doQueryAllResults");
        gridFields = ["OBJECTID", "project", "stratum_name", "stratum_ecoregion", "sites_surveyed", "pct_very_high_condition", "pct_high_condition",
            "pct_medium_condition", "pct_low_condition", "pct_absent_overall_stress", "pct_low_overall_stress", "pct_med_overall_stress",
             "pct_high_overall_stress", "pct_very_high_overall_stress", "mean_rel_native_cov", "mean_abs_nox_cov"
        ];

        // var queryResults = new QueryTask({
        //     url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer/2"
        // });
       

        allQueryResults = {
        where: "1=1",
        outFields: ["OBJECTID", "project", "stratum_name", "stratum_ecoregion", "sites_surveyed", "pct_very_high_condition", "pct_high_condition",
            "pct_medium_condition", "pct_low_condition", "pct_absent_overall_stress", "pct_low_overall_stress", "pct_med_overall_stress",
             "pct_high_overall_stress", "pct_very_high_overall_stress", "mean_rel_native_cov", "mean_abs_nox_cov"]
        };

    

        studyResultsLayer.queryFeatures(allQueryResults).then(function(rslts) {
            console.log(rslts);

            var poop = rslts;
            console.log(poop);

            var gridFieldArray = [
                //{alias: 'OBJECTID', name: 'OBJECTID'}, 
                {
                    alias: 'Project',
                    name: 'project'
                },
                {
                    alias: 'Stratum Name',
                    name: 'stratum_name'
                },
                {
                    alias: 'Stratum Ecoregion',
                    name: 'stratum_ecoregion'
                },
                {
                    alias: 'Sites Surveyed (#)',
                    name: 'sites_surveyed'
                },
                {
                    alias: 'Very High Condition Score (%)',
                    name: 'pct_very_high_condition'
                },
                {
                    alias: 'High Condition Score (%)',
                    name: 'pct_high_condition'
                },
                {
                    alias: 'Medium Condition Score (%)',
                    name: 'pct_medium_condition'
                },
                {
                    alias: 'Low Condition Score (%)',
                    name: 'pct_low_condition'
                },
                {
                    alias: 'Stressors Absent (%)',
                    name: 'pct_absent_overall_stress'
                },
                {
                    alias: 'Stressors Low (%)',
                    name: 'pct_low_overall_stress'
                },
                {
                    alias: 'Stressors Medium (%)',
                    name: 'pct_med_overall_stress'
                },
                {
                    alias: 'Stressors High (%)',
                    name: 'pct_high_overall_stress'
                },
                {
                    alias: 'Stressors Very High (%)',
                    name: 'pct_very_high_overall_stress'
                },
                {
                    alias: 'Mean Relative Native Plant Cover (%)',
                    name: 'mean_rel_native_cov'
                },
                {
                    alias: 'Mean Absolute Noxious Plant Cover (%)',
                    name: 'mean_abs_nox_cov'
                },
            ];

            poop.fields = gridFieldArray;

            // poop.fields.forEach(function(fields, i) {
            //     fields.name = gridFields[i]
            //     fields.alias = gridFieldArray[i]
            // });

            console.log(poop);
            console.log(rslts);
            getResults(rslts);

        });

       

    }

    
    function doQueryWassProjects() {

        doGridClear();
        mapView.graphics.removeAll()
        console.log("doQueryWassProjects");
        gridFields = ["OBJECTID", "region", "years", "ProjectReport", "project", "target_population", "target_population_comparison",
            "sample_frame", "site_selection"];

        // var queryResults = new QueryTask({
        //     url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer/0"
        // });
       

        allQueryResults = {
        where: "1=1",
        outFields: ["OBJECTID", "region", "years", "ProjectReport", "project", "target_population", "target_population_comparison",
        "sample_frame", "site_selection"]
        }

    

        assessmentLayer.queryFeatures(allQueryResults).then(function(rslts) {
            console.log(rslts);

            var poop = rslts;
            console.log(poop);

            var gridFieldArray = [
                //{alias: 'OBJECTID', name: 'OBJECTID'}, 
                {
                    alias: 'Project',
                    name: 'project'
                },
                {
                    alias: 'Region',
                    name: 'region'
                },
                {
                    alias: 'Years',
                    name: 'years'
                },
                {
                    alias: 'Project Report',
                    name: 'ProjectReport'
                },
                {
                    alias: 'Target Population',
                    name: 'target_population'
                },
                {
                    alias: 'target_population_comparison',
                    name: 'target_population_comparison'
                },
                {
                    alias: 'sample_frame',
                    name: 'sample_frame'
                },
                {
                    alias: 'site_selection',
                    name: 'site_selection'
                }
            ];

            poop.fields = gridFieldArray;

            // poop.fields.forEach(function(fields, i) {
            //     fields.name = gridFields[i]
            //     fields.alias = gridFieldArray[i]
            // });

            console.log(poop);
            console.log(rslts);
            getResults(rslts);

        });
    }

    function doQueryWassProjectSpecific() {

        doGridClear();
        mapView.graphics.removeAll()
        console.log("doQueryWassProjectsSpecific");
        gridFields = ["OBJECTID", "region", "years", "ProjectReport", "project", "target_population", "target_population_comparison",
            "sample_frame", "site_selection"];

        // var queryWResults = new QueryTask({
        //     url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Condition/MapServer/2" //studyResultsLayer
        // });
       
        objectid = mapView.popup.viewModel.selectedFeature.attributes.OBJECTID;
        console.log(objectid);

        relationQueryWResults = {
            objectIds: [objectid],
            outFields: ["OBJECTID", "region", "years", "ProjectReport", "project", "target_population", "target_population_comparison",
            "sample_frame", "site_selection"],
            relationshipId: 0
        };

        studyResultsLayer.queryRelatedFeatures(relationQueryWResults).then(function(rslts) {
            console.log(rslts);
            console.log(rslts[objectid].features[0].attributes.project);
            

            var poop = rslts[objectid];
            console.log(poop);

    

            var gridFieldArray = [
                //{alias: 'OBJECTID', name: 'OBJECTID'}, 
                {
                    alias: 'Project',
                    name: 'project'
                },
                {
                    alias: 'Region',
                    name: 'region'
                },
                {
                    alias: 'Years',
                    name: 'years'
                },
                {
                    alias: 'Project Report',
                    name: 'ProjectReport'
                },
                {
                    alias: 'Target Population',
                    name: 'target_population'
                },
                {
                    alias: 'Target Population Comparison',
                    name: 'target_population_comparison'
                },
                {
                    alias: 'Sample Frame',
                    name: 'sample_frame'
                },
                {
                    alias: 'Site Selection',
                    name: 'site_selection'
                }
            ];

            poop.fields = gridFieldArray;

            // poop.fields.forEach(function(fields, i) {
            //     fields.name = gridFields[i]
            //     fields.alias = gridFieldArray[i]
            // });

            console.log(poop);
            console.log(rslts);
            getResults(rslts[objectid]);

        });
    }


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
            if (item.title === "Wetland Assessment Projects") {
                item.actionsSections = [
                    [{
                        title: "Feature Table",
                        className: "esri-icon-table",
                        id: "feature-table"
                    },{
                        title: "Increase opacity",
                        className: "esri-icon-up",
                        id: "increase-opacity"
                    }, {
                        title: "Decrease opacity",
                        className: "esri-icon-down",
                        id: "decrease-opacity"
                    }, {
                        title: "Layer info",
                        className: "esri-icon-question",
                        id: "layer-info"
                    }]
                ];
            } else if (item.title === "Wetland Assessment Study Results") {
                item.actionsSections = [
                    [{
                        title: "Feature Table",
                        className: "esri-icon-table",
                        id: "feature-table"
                    },{
                        title: "Increase opacity",
                        className: "esri-icon-up",
                        id: "increase-opacity"
                    }, {
                        title: "Decrease opacity",
                        className: "esri-icon-down",
                        id: "decrease-opacity"
                    },{
                        title: "Layer info",
                        className: "esri-icon-question",
                        id: "layer-info"
                    }]
                ];
            } else {
                item.actionsSections = [
                    [{
                        title: "Increase opacity",
                        className: "esri-icon-up",
                        id: "increase-opacity"
                    }, {
                        title: "Decrease opacity",
                        className: "esri-icon-down",
                        id: "decrease-opacity"
                    }, {
                        title: "Layer info",
                        className: "esri-icon-question",
                        id: "layer-info"
                    }]
                ];
            }
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




    //DOWNLOAD CODE
            //load download geoprocessor
            // var gp = new Geoprocessor(gpUrl);
            //     gp.outSpatialReference = { // autocasts as new SpatialReference()
            //     wkid: 102100
            // };

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

        //setUpClickHandler();

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
        // function setUpClickHandler() {
        //     mapView.on("click", function(event) {
        //         console.log("Click Event", event);
        //         mapView.hitTest(event).then(function(response) {
        //             var results = response.results;
        //             // Found a valid graphic
        //             if (results.length && results[results.length - 1]
        //                 .graphic) {
        //                 // Check if we're already editing a graphic
        //                 if (!editGraphic) {
        //                     // Save a reference to the graphic we intend to update
        //                     editGraphic = results[results.length - 1].graphic;
        //                     // Remove the graphic from the GraphicsLayer
        //                     // Sketch will handle displaying the graphic while being updated
        //                     tempGraphicsLayer.remove(editGraphic);
        //                     sketchViewModel.update(editGraphic);
        //                 }
        //             }
        //         });
        //     });
        // }


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
        modal = document.getElementById("myModal");
        span = document.getElementsByClassName("close")[0];
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

            geoprocessor.submitJob(gpUrl, params).then(function(jobInfo){


                var jobid = jobInfo.jobId;

                    var options = {
                        interval: 1500,
                        statusCallback: function(j) {
                        console.log("Job Status: ", j.jobStatus);
                        var waiting = j.jobStatus;
                        document.getElementsByClassName("modal-content")[0].innerHTML = '<b>Please wait while we process your file.</b> <br>';
                        }
                    };

                    jobInfo.waitForJobCompletion(jobid, options).then(function(rslt) {

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
            var offsetRight = container.height() - (e.clientY - container.offset().top);

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
        setLegendMobile(isMobile);
    }


    function setLegendMobile(isMobile) {
        var toAdd = isMobile ? expandLegend : legend;
        var toRemove = isMobile ? legend : expandLegend;

        mapView.ui.remove(toRemove);
        mapView.ui.add(toAdd, "top-left");
    }

    
    reactiveUtils.watch(() => landscapeGroup.visible === true, (e) => {
        console.log(e)
        if (e == true) {

            
            //div.esri-ui-bottom-right.esri-ui-corner > div
            document.querySelector("#mapViewDiv > div.esri-view-root > div.esri-ui > div.esri-ui-inner-container.esri-ui-corner-container > div.esri-ui-bottom-right.esri-ui-corner > div").style.display="block";
            document.getElementById("fieldDiv").style.display="block"
            showHideCalcitePanels("#panelInfo", "#collapseInfo");
            generateRenderer();
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

      reactiveUtils.whenOnce(
          () => mapView?.updating, generateRenderer
          
      )


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
        return new Promise(resolve => {
            var removed = $();
        if (selectedLayer == '0') {

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
            $("#field-select option[value=pct_wells_rising]").remove();
            $("#field-select option[value=pct_wells_falling]").remove();
            $("#field-select option[value=mean_falling_slope]").remove();
            $("#field-select option[value=mean_rising_slope]").remove();
            $("#field-select option[value=surface_water_trend]").remove();
            $("#field-select option[value=surface_water_slope]").remove();

        } else if (selectedLayer == '2') {

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
        option3.text = "Wells Falling Slope Mean: Mean Sen’s Slope for Falling Wells (ft/yr)";
        x.add(option3);
    }
    if ($("#field-select option[value='mean_rising_slope']").length == 0) {
        
        var option4 = document.createElement("option");
        option4.value = "mean_rising_slope";
        option4.text = "Wells Rising Slope Mean: Mean Sen’s Slope for Rising Wells (ft/yr)";
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
        console.log("remove landscape layers")
        landscapeGroup.layers.removeAll();

      //grab values from element for field choice
      const selectedLayer = layerSelect.options[layerSelect.selectedIndex].value;
      const selectedLayerTitle = layerSelect.options[layerSelect.selectedIndex].text;
      var fieldLabel = await resolveMetrics();
      



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


       landscapeLayer = new FeatureLayer({
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


       landscapeLayer = new FeatureLayer({
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

       landscapeLayer = new FeatureLayer({
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


       landscapeLayer = new FeatureLayer({
           title: "Ecoregion",
         url: "https://webmaps.geology.utah.gov/arcgis/rest/services/Wetlands/Wetland_Landscape_Data/MapServer/" + selectedLayer,
             popupTemplate: {
           // autocast as esri/PopupTemplate
           title: "Ecoregion",
           outFields: ["*"],
           content: contentEcoregion
         },
       });
}


      landscapeGroup.layers.push(landscapeLayer);

      
    // mapView.popup.watch("selectedFeature", (evt) => {
    //     console.log(evt)
    //     objectid = evt.attributes.OBJECTID;
    // });
    

      
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
          let rendererTrend = {
            type: "unique-value",  // autocasts as new UniqueValueRenderer()
            field: "surface_water_trend",
            //defaultSymbol: { type: "simple-fill" },  // autocasts as new SimpleFillSymbol()
            defaultLabel: "No Data",
            uniqueValueInfos: [{
              // All features with value of "North" will be blue
              value: "2",
              label: "Decreasing",
              symbol: {
                type: "simple-fill",  // autocasts as new SimpleFillSymbol()
                color: [255, 86, 74],
                outline: {  // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.1],
                    width: "1px"
                  }
              }
            }, {
              // All features with value of "East" will be green
              value: "3",
              label: "Increasing",
              symbol: {
                type: "simple-fill",  // autocasts as new SimpleFillSymbol()
                color: [74, 80, 255],
                outline: {  // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.1],
                    width: "1px"
                  }
              }
            }, {
              // All features with value of "South" will be red
              value: "1",
              label: "No Trend",
              symbol: {
                type: "simple-fill",  // autocasts as new SimpleFillSymbol()
                color: "beige",
                outline: {  // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.1],
                    width: "1px"
                  }
              }
            }, {
              // All features with value of "West" will be yellow
              value: "0",
              label: "No data",
              symbol: {
                type: "simple-fill",  // autocasts as new SimpleFillSymbol()
                color: "168, 168, 168, 0",
                outline: {  // autocasts as new SimpleLineSymbol()
                    color: [128, 128, 128, 0.1],
                    width: "1px"
                  }
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
            rendererResponse.renderer.defaultLabel = "No Data";
            landscapeLayer.renderer = rendererResponse.renderer;

          if (!landscapeGroup.layers.includes(landscapeLayer)) {
            //map.add(huc12);
            landscapeGroup.layers.push(landscapeLayer);
          }

          if (classSelect.value === "manual") {
            // if manual is selected, then add or update
            // a classed color slider to allow the user to
            // construct manual class breaks

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
            renderer.defaultLabel = "No Data";

            landscapeLayer.renderer = renderer;
          }

          slider.on(
            ["thumb-change", "thumb-drag", "min-change", "max-change"],
            changeEventHandler
          );
        } else {
          slider.updateFromRendererResult(rendererResult, histogramResult);

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
console.log(event);

        // Capture the action id.
        var id = event.action.id;

        var title = event.item.title;

        if (title === "Riparian Mapping") {
            layer = ripData;
        } else if (title === "Riparian Project Information") {
            layer = ripMeta;
        } else if (title === "Wetland Mapping") {
            layer = wetGroup;
        } else if (title === "Watershed (HUC12)") {
            layer = landscapeLayer;
        } else if (title === "Surface Ownership and Administration") {
            layer = ownershipLayer;
        } else if (title === "Watershed (HUC12) by Ecoregion") {
            layer = landscapeLayer;
        } else if (title === "Watershed (HUC8)") {
            layer = landscapeLayer;
        } else if (title === "Watershed (HUC8) by Ecoregion") {
            layer = landscapeLayer;
        } else if (title === "Ecoregion") {
            layer = landscapeLayer;
        } else if (title === "Wetland Assessment Projects") {
            layer = assessmentLayer;
        } else if (title === "Wetland Assessment Study Results") {
            layer = studyResultsLayer;
        } else if (title === "Wetland Stressors") {
            layer = stressorsLayer;
        } else if (title === "Wetland Project Information") {
            layer = wetMeta;
        } else if (title === "LLWW Mapping Areas") {
            layer = cacheProjectsArea;
        } else if (title === "LLWW Descriptions") {
            layer = llwwMapping;
        }



        if (id === "increase-opacity") {
            // if the increase-opacity action is triggered, then
            // increase the opacity of the GroupLayer by 0.25

            if (layer.opacity < 1) {
                layer.opacity += 0.1;
            }
        } else if (id === "decrease-opacity") {
            // if the decrease-opacity action is triggered, then
            // decrease the opacity of the GroupLayer by 0.25

            if (layer.opacity > 0) {
                layer.opacity -= 0.1;
            }
        } else if (id === "feature-table") {
            console.log("feature-table");
            if (title == "Wetland Assessment Study Results") {
                console.log(title);
                doQueryStudyAllResults();
            } else if (title === "Wetland Assessment Projects") {
                console.log(title);
                doQueryWassProjects();
            } else {
                console.log("No Table");
                modal.style.display = "block";
                document.getElementsByClassName("modal-content")[0].innerHTML = '<b>No feature table for this layer.</b> <br>';  
            }
        } else if (id === "layer-info") {
            console.log("Layer Info");
            query("#panelData").collapse("show");
            query("#collapseData").collapse("show");
        }

    });

    document.getElementById("openData").addEventListener("click", openData);

    function openData() {
        console.log("Open data");
        query("#panelData").collapse("show");
        query("#collapseData").collapse("show");
    }

    
    function doClear() {
        mapView.graphics.removeAll()
        console.log("doClear");
        sitesCount = 0;
        if (grid) {
            dataStore.objectStore.data = {};
            grid.set("collection", dataStore);
        }
        gridDis.style.display = 'none';
        domClass.remove("mapViewDiv", 'withGrid');
        mapView.graphics.removeAll();
    //     if (highlight) {
    //         highlight.remove();
        
    // }
}

// mapView.popup.watch("selectedFeature", (evt) => {
//     console.log(evt)
//         objectid = evt.attributes.OBJECTID;
// });


    mapView.popup.on("trigger-action", function(event) { // Execute the relatedProjects() function if the project action is clicked
        if (event.action.id === "study-results") {
            layer = studyResultsLayer;
            console.log("results action clicked");
            console.log(event);
            doQueryResults();
        } else if (event.action.id === "project-table") {
            layer = assessmentLayer;
            console.log("projects table action clicked");
            console.log(event);
            doQueryWassProjectSpecific();
        }
    });
//hide grid on X click.
    document.getElementById("removeX").addEventListener("click", function(evt) {
        mapView.popup.close();
        mapView.graphics.removeAll();
        doClear();

    })




});