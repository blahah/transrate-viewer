var width = 500,
    height = 500,
    margin = 50;

/*jshint browser:true, indent:2, globalstrict: true, laxcomma: true, laxbreak: true */
/*global d3:true */

/*
 * colorlegend
 *
 * This script can be used to draw a color legend for a
 * [d3.js scale](https://github.com/mbostock/d3/wiki/Scales)
 * on a specified html div element.
 * [d3.js](http://mbostock.github.com/d3/) is required.
 *
 */

'use strict';

var colorlegend = function (target, scale, type, options) {

  var scaleTypes = ['linear', 'quantile', 'ordinal']
    , found = false
    , opts = options || {}
    , boxWidth = opts.boxWidth || 20        // width of each box (int)
    , boxHeight = opts.boxHeight || 20      // height of each box (int)
    , title = opts.title || null            // draw title (string)
    , fill = opts.fill || false             // fill the element (boolean)
    , linearBoxes = opts.linearBoxes || 9   // number of boxes for linear scales (int)
    , htmlElement = $(target)
    , w = htmlElement.offsetWidth           // width of container element
    , h = htmlElement.offsetHeight          // height of container element
    , colors = []
    , padding = [2, 4, 10, 4]               // top, right, bottom, left
    , boxSpacing = type === 'ordinal' ? 3 : 0 // spacing between boxes
    , titlePadding = title ? 11 : 0
    , domain = scale.domain()
    , range = scale.range()
    , i = 0;

  // check for valid input - 'quantize' not included
  for (i = 0 ; i < scaleTypes.length ; i++) {
    if (scaleTypes[i] === type) {
      found = true;
      break;
    }
  }
  if (! found)
    throw new Error('Scale type, ' + type + ', is not suported.');


  // setup the colors to use
  if (type === 'quantile') {
    colors = range;
  }
  else if (type === 'ordinal') {
    for (i = 0 ; i < domain.length ; i++) {
      colors[i] = range[i];
    }
  }
  else if (type === 'linear') {
    var min = domain[0];
    var max = domain[domain.length - 1];
    for (i = 0; i < linearBoxes ; i++) {
      colors[i] = scale(min + i * ((max - min) / linearBoxes));
    }
  }

  // check the width and height and adjust if necessary to fit in the element
  // use the range if quantile
  if (fill || w < (boxWidth + boxSpacing) * colors.length + padding[1] + padding[3]) {
    boxWidth = (w - padding[1] - padding[3] - (boxSpacing * colors.length)) / colors.length;
  }
  if (fill || h < boxHeight + padding[0] + padding[2] + titlePadding) {
    boxHeight = h - padding[0] - padding[2] - titlePadding;
  }

  // set up the legend graphics context
  var legend = d3.select(target)
    .append('svg')
      .attr('width', w)
      .attr('height', h)
    .append('g')
      .attr('class', 'colorlegend')
      .attr('transform', 'translate(' + padding[3] + ',' + padding[0] + ')')
      .style('font-size', '11px')
      .style('fill', '#666');

  var legendBoxes = legend.selectAll('g.legend')
      .data(colors)
    .enter().append('g');

  // value labels
  legendBoxes.append('text')
      .attr('class', 'colorlegend-labels')
      .attr('dy', '.71em')
      .attr('x', function (d, i) {
        return i * (boxWidth + boxSpacing) + (type !== 'ordinal' ? (boxWidth / 2) : 0);
      })
      .attr('y', function () {
        return boxHeight + 2;
      })
      .style('text-anchor', function () {
        return type === 'ordinal' ? 'start' : 'middle';
      })
      .style('pointer-events', 'none')
      .text(function (d, i) {
        // show label for all ordinal values
        if (type === 'ordinal') {
          return domain[i];
        }
        // show only the first and last for others
        else {
          if (i === 0)
            return domain[0];
          if (i === colors.length - 1)
            return domain[domain.length - 1];
        }
      });

  // the colors, each color is drawn as a rectangle
  legendBoxes.append('rect')
      .attr('x', function (d, i) {
        return i * (boxWidth + boxSpacing);
      })
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .style('fill', function (d, i) { return colors[i]; });

  // show a title in center of legend (bottom)
  if (title) {
    legend.append('text')
        .attr('class', 'colorlegend-title')
        .attr('x', (colors.length * (boxWidth / 2)))
        .attr('y', boxHeight + titlePadding)
        .attr('dy', '.71em')
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .text(title);
  }

  return this;
};

var plot = function(data, xvar, yvar, container, config) {
  var svg = d3.select(container + '>.plot')
              .append("svg")
              .attr("width", width)
              .attr("height", height);

  var xrange = d3.extent(data.map(function(d) { return +d[xvar]; }));
  var xmin = xrange[0];
  var xmax = xrange[1];
  var xstep = (xmax - xmin) / 5;
  var x = d3.scale.linear().domain(xrange).range([margin, width - margin]);

  var yrange = d3.extent(data.map(function(d) { return +d[yvar]; }));
  var ymin = yrange[0];
  var ymax = yrange[1];
  var ystep = (ymax - ymin) / 5;
  var y = d3.scale.linear().domain(yrange).range([height - margin, margin]);

  var c = d3.scale.category10().domain(['true', 'false']);

  colorlegend(container + '>.legend', c, "ordinal", {title: "has CRB"});

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + (height - margin) + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "axis")
     .attr("transform", "translate(" + margin + ",0)")
    .call(yAxis);

  svg.selectAll(".h").data(d3.range(xmin+xstep, xmax, xstep)).enter()
    .append("line").classed("h", 0.5)
    .attr("x1",margin).attr("x2",height - margin)
    .attr("y1",y).attr("y2",y)

  svg.selectAll(".v").data(d3.range(ymin+ystep, ymax, ystep)).enter()
    .append("line").classed("v", 0.5)
    .attr("y1",margin).attr("y2",width-margin)
    .attr("x1",x).attr("x2",x)

  if (config.xlab) {
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width - margin)
        .attr("y", height - 5)
        .text(config.xlab);
  }

  if (config.ylab) {
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("x", -margin)
        .attr("y", 5)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text(config.ylab);
  }

  // start with blank points so as not to freeze execution
  svg.selectAll("circle").data(data).enter()
    .append("circle")
    .attr("cx", function(d) { return x(0); })
    .attr("cy", function(d) { return y(0); })
    .attr("r", function(d) { return 0; })
    .style("opacity", 1)
    // .append("title")
    // .text(function(d) {return d.contig_name;})

  // now initiate by moving points to their position
  svg.selectAll("circle").transition().duration(100)
    .attr("cx", function(d) { return x(+d[xvar]); })
    .attr("cy", function(d) { return y(+d[yvar]); })
    .style("fill", function(d) { return c(d.has_crb) })
    .attr("r", function(d) { return 1; })
}

d3.csv('/test.csv', function(data) {

  var filter = crossfilter(data);

  // orf_length csv linguistic_complexity_6
  plot(data, 'orf_length', 'linguistic_complexity_6', '#left', {
    xlab: "Orf length (nucleotides)",
    ylab: "Linguistic complexity (k=6)"
  });

  // uncovered_bases vs edit_distance_per_base
  plot(data, 'p_uncovered_bases', 'edit_distance_per_base', '#right', {
    xlab: "Uncovered bases",
    ylab: "Edit distance per base"
  });
})
