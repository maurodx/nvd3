nv.models.gauge = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    //var gauge = nv.models.gauge();
    var tooltip = nv.models.tooltip();

    var margin = {top: 0, right: 0, bottom: 0, left: 0}
	,redZone={from: 0, to:0}
	,yellowZone={from: 0, to:0}
	,greenZone={from: 0, to:0}
	,unit=""
        , width = null
        , height = null
        , color = nv.utils.defaultColor()
        , id = Math.round(Math.random() * 100000)
        , defaultState = null
        , noData = null
        , duration = 250
        , dispatch = d3.dispatch('stateChange', 'changeState','chartClick', 'elementClick', 'elementDblClick', 'elementMousemove', 'elementMouseover', 'elementMouseout', 'renderEnd')
        ;

    tooltip.duration(0);
	
	
	var gauges = [];
    var dashContainer;
    var readings = [];	// pretend readings are supplied (named by gauge).
    var i = 0;
    var interv0 = 0;
    var xDim = 0;

            var greenColor = "#107618";
            var yellowColor = "#FFC900";
            var redColor = "#EC4922";
            var darkColor = "#101010";
            var blueColor = "#1030B0";
            var dimBlueColor = "#101560";
            var lightColor = "#EEEEEE";
	    var greyColor = "303030";
	    var darkGreyColor = "101010";
	    var blackColor = "000000";
	    var lightBlueColor = "7095F0";
	

    //============================================================
    // Private Variables
    //------------------------------------------------------------

    var renderWatch = nv.utils.renderWatch(dispatch);
    tooltip
        .headerEnabled(false)
        .valueFormatter(function(d, i) {
            return d;
        });


	function createGauge(myContainer, name, label,unit,  width, height, redZone, yellowZone, greenZone,value) {
        var config = {
            size: Math.min(width,height),
            label: label,
            minorTicks: 5,
			unit:unit
        };

        config.redZones = [];	// allows for example upper and lower limit zones
        config.redZones.push(redZone);

        config.yellowZones = [];
        config.yellowZones.push(yellowZone);

        config.greenZones = [];
        config.greenZones.push(greenZone);
        config.value=value;
		
        gauges[name] = new Gauge(myContainer, name, config);
        gauges[name].render();
	readings[name] = 50;
    }

    function Gauge(myContainer, name, configuration) {
        this.name = name;
		this.myContainer = myContainer;

        var self = this; // some internal d3 functions do not "like" the "this" keyword, hence setting a local variable

        this.configure = function (configuration) {
            this.config = configuration;

            //this.config.size = this.config.size * 0.9;

            this.config.radius = this.config.size * 0.97 / 2;
            this.config.cx =  this.config.size / 2;
            this.config.cy = this.config.size / 2;

			this.config.unit = configuration.unit || "";
			
            this.config.min = configuration.min || 0;
            this.config.max = configuration.max || 100;
            this.config.range = this.config.max - this.config.min;

            this.config.majorTicks = configuration.majorTicks || 5;
            this.config.minorTicks = configuration.minorTicks || 2;

            this.config.bezelColor = configuration.bezelColor || lightColor;
            this.config.bezelDimColor = configuration.bezelDimColor || greyColor;
            //this.config.dashColor = configuration.dashColor || blueColor; move to Dash
            //this.config.dimDashColor = configuration.dimDashColor || dimBlueColor; move to Dash
            this.config.greenColor = configuration.greenColor || greenColor;
            this.config.yellowColor = configuration.yellowColor || yellowColor;
            this.config.redColor = configuration.redColor || redColor;
            this.config.faceColor = configuration.faceColor || lightColor;
            this.config.dimFaceColor = configuration.dimFaceColor || darkGreyColor;
            this.config.lightColor = configuration.lightColor || "#EEEEEE";
	    this.config.greyColor = configuration.greyColor || "101010";
	    this.config.lightBlueColor = configuration.lightBlueColor || "6085A0";
        };
        
        this.render = function () {
			this.myContainer.selectAll("svg").remove();
            this.body = this.myContainer//dashContainer//d3.select("#" + this.placeholderName)
                .append("svg:svg")
                .attr("class", "gauge")
                .attr("x", this.myContainer.x)//this.config.cx-this.config.size/4)
                .attr("y", this.myContainer.y)//this.config.cy-this.config.size/4)
                .attr("width", this.config.size*1.1)//this.myContainer.width)
                .attr("height", this.config.size*1.1);//this.myContainer.height);
  
            this.body.append("svg:circle")	// outer shell
                .attr("cx", this.config.cx)
                .attr("cy", this.config.cy)
                .attr("r", this.config.radius)
                .style("fill", "#ccc")
                .style("stroke", blackColor )
                .style("stroke-width", "0.5px");

            this.body.append("svg:circle")	// bezel
                .attr("cx", this.config.cx)
                .attr("cy", this.config.cy)
                .attr("r", 0.9 * this.config.radius)
                .style("fill", (xDim < 0.5 ? this.config.bezelColor : this.config.bezelDimColor))
                .style("stroke", "#e0e0e0")
                .style("stroke-width", "2px");

            var faceContainer = this.body.append("svg:g").attr("class", "faceContainer");	// for day/night changes
            var bandsContainer = this.body.append("svg:g").attr("class", "bandsContainer");	// for day/night changes
            var ticksContainer = this.body.append("svg:g").attr("class", "ticksContainer");	// for day/night changes
            this.redrawDimmableFace(xDim);//0);

            var pointerContainer = this.body.append("svg:g").attr("class", "pointerContainer");
            this.drawPointer(this.config.value);
            pointerContainer.append("svg:circle")
                .attr("cx", this.config.cx)
                .attr("cy", this.config.cy)
                .attr("r", 0.12 * this.config.radius)
                .style("fill", "#4684EE")
                .style("stroke", "#666")
                .style("opacity", 1);
        };

	this.drawBands = function(bandsContainer) { 
            for (var index in this.config.greenZones) {
                this.drawBand(bandsContainer,this.config.greenZones[index].from, this.config.greenZones[index].to, self.config.greenColor);
            }

            for (var index in this.config.yellowZones) {
                this.drawBand(bandsContainer,this.config.yellowZones[index].from, this.config.yellowZones[index].to, self.config.yellowColor);
            }

            for (var index in this.config.redZones) {
                this.drawBand(bandsContainer,this.config.redZones[index].from, this.config.redZones[index].to, self.config.redColor);
            }
	};

        this.redrawDimmableFace = function (value) {
            this.drawFace(value < 0.5 ? self.config.faceColor : self.config.dimFaceColor,	// facecolor
			  value < 0.5 ? self.config.greyColor : lightBlueColor);
        }

        this.drawTicks = function (ticksContainer,color) {

            var fontSize = Math.round(this.config.size / 16);
            var majorDelta = this.config.range / (this.config.majorTicks - 1);
            for (var major = this.config.min; major <= this.config.max; major += majorDelta) {
                var minorDelta = majorDelta / this.config.minorTicks;
                for (var minor = major + minorDelta; minor < Math.min(major + majorDelta, this.config.max); minor += minorDelta) {
                    var minorpoint1 = this.valueToPoint(minor, 0.75);
                    var minorpoint2 = this.valueToPoint(minor, 0.85);

		    ticksContainer.append("svg:line")
                        .attr("x1", minorpoint1.x)
                        .attr("y1", minorpoint1.y)
                        .attr("x2", minorpoint2.x)
                        .attr("y2", minorpoint2.y)
                        .style("stroke", color)
                        .style("stroke-width", "1px");
                }

                var majorpoint1 = this.valueToPoint(major, 0.7);
                var majorpoint2 = this.valueToPoint(major, 0.85);

			ticksContainer.append("svg:line")
                    .attr("x1", majorpoint1.x)
                    .attr("y1", majorpoint1.y)
                    .attr("x2", majorpoint2.x)
                    .attr("y2", majorpoint2.y)
                    .style("stroke", color)
                    .style("stroke-width", "2px");

                if (major == this.config.min || major == this.config.max) {
                    var point = this.valueToPoint(major, 0.63);

		    ticksContainer.append("svg:text")
                        .attr("x", point.x)
                        .attr("y", point.y)
                        .attr("dy", fontSize / 3)
                        .attr("text-anchor", major == this.config.min ? "start" : "end")
                        .text(major)
                        .style("font-size", fontSize + "px")
                        .style("fill", color)
                        .style("stroke-width", "0px");
                }
            }
        };


        this.redraw = function (value) {
            this.drawPointer(value);
        };

        this.dimDisplay = function (value) {
            this.redrawDimmableFace(value);
        };

        this.drawBand = function (bandsContainer, start, end, color) {
            if (0 >= end - start) return;

            bandsContainer.append("svg:path")
                .style("fill", color)
                .attr("d", d3.svg.arc()
                .startAngle(this.valueToRadians(start))
                .endAngle(this.valueToRadians(end))
                .innerRadius(0.70 * this.config.radius)
                .outerRadius(0.85 * this.config.radius))
                .attr("transform", function () {
                return "translate(" + self.config.cx + ", " + self.config.cy + ") rotate(270)";
            });
        };

        this.drawFace = function (colorFace,colorTicks) {
            var arc0 = d3.svg.arc()
                .startAngle(0) //this.valueToRadians(0))
                .endAngle(2 * Math.PI)
                .innerRadius(0.00 * this.config.radius)
                .outerRadius(0.9 * this.config.radius);

            var faceContainer = this.body.selectAll(".faceContainer");
            var bandsContainer = this.body.selectAll(".bandsContainer");
            var ticksContainer = this.body.selectAll(".ticksContainer");
            var pointerContainer = this.body.selectAll(".pointerContainer");
            var face = faceContainer.selectAll("path");
            if (face == 0)
			{
                faceContainer
                  .append("svg:path")
                  .attr("d", arc0) //d3.svg.arc()
                  .style("fill", colorFace)
                  .style("fill-opacity", 0.7)
                  .attr("transform",
                      "translate(" + self.config.cx + ", " + self.config.cy + ")");

				this.drawBands(bandsContainer);
				this.drawTicks(ticksContainer,colorTicks);
				var fontSize = Math.round(this.config.size / 11);
                faceContainer.append("svg:text")
                    .attr("x", this.config.cx)
                    //.attr("y", this.config.cy - this.config.size/6 - fontSize / 2 )
					.attr("y", this.config.cy + this.config.size/2 + fontSize / 2 )
                    .attr("dy", fontSize / 2)
                    .attr("text-anchor", "middle")
                    .text(this.config.label)
                    .style("font-size", fontSize + "px")
                    .style("fill", colorTicks)
                    .style("stroke-width", "0px");
	    }
            else
	    {
                face.style("fill", colorFace);
		var facetxt = faceContainer.selectAll("text");
		facetxt.style("fill", colorTicks);
        var ptrtxt = pointerContainer.selectAll("text");
        ptrtxt.style("fill", colorTicks);
		var ticks = ticksContainer.selectAll("line");
		ticks.style("stroke", colorTicks);
		var texts = ticksContainer.selectAll("text");
		texts.style("fill", colorTicks);
        
	    }
	};

        this.drawPointer = function (value) {
            var delta = this.config.range / 13;

            var head = this.valueToPoint(value, 0.85);
            var head1 = this.valueToPoint(value - delta, 0.12);
            var head2 = this.valueToPoint(value + delta, 0.12);

            var tailValue = value - (this.config.range * (1 / (270 / 360)) / 2);
            var tail = this.valueToPoint(tailValue, 0.28);
            var tail1 = this.valueToPoint(tailValue - delta, 0.12);
            var tail2 = this.valueToPoint(tailValue + delta, 0.12);

            var data = [head, head1, tail2, tail, tail1, head2, head];

            var line = d3.svg.line()
                .x(function (d) {
                return d.x;
            })
                .y(function (d) {
                return d.y;
            })
                .interpolate("basis");

            var pointerContainer = this.body.select(".pointerContainer");

            var pointer = pointerContainer.selectAll("path").data([data]);

            pointer.enter()
                .append("svg:path")
                .attr("d", line)
                .style("fill", "#dc3912")
                .style("stroke", "#c63310")
                .style("fill-opacity", 0.7);

            pointer.transition()
                .attr("d", line)
            //.ease("linear")
            .duration(i>=0 ? 50 : 500);

            var fontSize = Math.round(this.config.size / 9);
            pointerContainer.selectAll("text")
                .data([value])
                .text(""+Math.round(value)+" "+this.config.unit)
                .enter()
                .append("svg:text")
                .attr("x", this.config.cx)
                .attr("y",  this.config.cy + this.config.size/6 + fontSize)
                .attr("dy", fontSize / 2)
                .attr("text-anchor", "middle")
                .text(""+Math.round(value)+" "+this.config.unit)
                .style("font-size", fontSize + "px")
                .style("fill", "#000")
                .style("stroke-width", "0px");
        };

        this.valueToDegrees = function (value) {
            return value / this.config.range * 270 - 45;
        };

        this.valueToRadians = function (value) {
            return this.valueToDegrees(value) * Math.PI / 180;
        };

        this.valueToPoint = function (value, factor) {
            var len = this.config.radius * factor;
            var inRadians = this.valueToRadians(value);
            var point = {
                x: this.config.cx - len * Math.cos(inRadians),
                y: this.config.cy - len * Math.sin(inRadians)
            };

            return point;
        };

        // initialization
        this.configure(configuration);
		this.dispatch=dispatch;
		return this;
    }



		//============================================================
    // Chart function
    //------------------------------------------------------------

    function chart(selection) {
        renderWatch.reset();
        //renderWatch.models(gauge);

        selection.each(function(data) {
            var container = d3.select(this);
            nv.utils.initSVG(container);

            var that = this;
            var availableWidth = nv.utils.availableWidth(width, container, margin),
                availableHeight = nv.utils.availableHeight(height, container, margin);

            chart.update = function() {
                if (duration === 0) {
                    container.call(chart);
                } else {
                    container.transition().duration(duration).call(chart);
                }
            };
            chart.container = this;

            // Display No Data message if there's nothing to show.
            if (!data || !data.length) {
                nv.utils.noData(chart, container);
                return chart;
            } else {
                container.selectAll('.nv-noData').remove();
            }

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('.nv-wrap.nv-gauge').data(data);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-gauge');
			var gEnter = wrapEnter.append('g'); 
             var g = wrap.select('g'); 

            //gEnter.append('g').attr('class', 'nv-gaugeWrap');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
			createGauge(g,"name",data[0].name,unit,availableWidth,availableHeight,redZone,yellowZone,greenZone,data[0].value);
            // Main Chart Component(s)
            /*gauge.width(availableWidth).height(availableHeight);
            var gaugeWrap = g.select('.nv-gaugeWrap').datum(data);
            d3.transition(gaugeWrap).call(gauge);*/

        });

		/*gauges["name"].dispatch.on('elementMouseover', function(evt) {
        evt['series'] = {
            key: evt.data.name,
            value: evt.data.size,
            color: evt.color
        };
        tooltip.data(evt).hidden(false);
    });
		gauges["name"].dispatch.on('elementMouseout', function(evt) {
        tooltip.hidden(true);
    });
		
		gauges["name"].dispatch.on('elementMousemove', function(evt) {
        tooltip();
    });*/
		
		
        renderWatch.renderEnd('gauge immediate');
        return chart;
    }

    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

    // expose chart's sub-components
    chart.dispatch = dispatch;
    /*chart.dispatch.on('elementMouseover.tooltip', function(evt) {
        evt['series'] = {
            key: evt.data.name,
            value: evt.data.size,
            color: evt.color
        };
        tooltip.data(evt).hidden(false);
    });*/
	
    chart.tooltip = tooltip;
    chart.options = nv.utils.optionsFunc.bind(chart);

    // use Object get/set functionality to map between vars and chart functions
    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
		width:      {get: function(){return width;}, set: function(_){width=_;}},
        height:     {get: function(){return height;}, set: function(_){height=_;}},
		id:         {get: function(){return id;}, set: function(_){id=_;}},
        unit:      {get: function(){return unit;}, set: function(_){unit=_;}},
        noData:         {get: function(){return noData;},         set: function(_){noData=_;}},
        defaultState:   {get: function(){return defaultState;},   set: function(_){defaultState=_;}},

        // options that require extra logic in the setter
        color: {get: function(){return color;}, set: function(_){
            color = _;
            //gauge.color(color);
        }},
        duration: {get: function(){return duration;}, set: function(_){
            duration = _;
            renderWatch.reset(duration);
            gauge.duration(duration);
        }},
        margin: {get: function(){return margin;}, set: function(_){
            margin.top    = _.top    !== undefined ? _.top    : margin.top;
            margin.right  = _.right  !== undefined ? _.right  : margin.right;
            margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
            margin.left   = _.left   !== undefined ? _.left   : margin.left;
        }},
		redZone:	{get: function(){return redZone;}, set: function(_){redZone=_;}},
		yellowZone:	{get: function(){return yellowZone;}, set: function(_){yellowZone=_;}},
		greenZone:	{get: function(){return greenZone;}, set: function(_){greenZone=_;}},
		
		
		
    });
    
    nv.utils.initOptions(chart);
    return chart;
};
