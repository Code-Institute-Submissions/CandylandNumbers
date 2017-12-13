queue()
    .defer(d3.json, "/new_candyland_numbers")
    .await(makeGraphs);

function makeGraphs(error, numbers) {
    if (error) {
        console.error("makeGraphs error on receiving dataset:", error.statusText);
        throw error;
    }

    //Clean bookingsNumbers data
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
    numbers.forEach(function (d) {
        d["date_of_event"] = dateFormat.parse(d["date_of_event"]);
        d["number_of_bookings"] = +d["number_of_bookings"];
        d["number_of_guests"] = +d["number_of_guests"];
    });

    //Create a Crossfilter instance
    var ndx = crossfilter(numbers);

    //Define Dimensions
    var dateDim = ndx.dimension(function (d) {
        return d["date_of_event"];
    });
    var eventTypeDim = ndx.dimension(function (d) {
        return d["event_type"];
    });
    var regionDim = ndx.dimension(function (d) {
        return d["region"];
    });
    var numberOfGuestsDim = ndx.dimension(function (d) {
        return d["number_of_guests"];
    });
    var numberOfBookingsDim = ndx.dimension(function (d) {
        return d["number_of_bookings"];
    });


    //Calculate metrics
    var numBookingsByDate = dateDim.group();
    var numBookingsByEventType = eventTypeDim.group();
    var numGuestsServed = numberOfGuestsDim.group();
    var numberOfBookings = numberOfBookingsDim.group();
    var regionGroup = regionDim.group();

    var all = ndx.groupAll();
    var totalGuests = all.reduceSum(function (d) {
        return d["number_of_guests"];
    });

    //Define values (to be used in charts)
    var minDate = dateDim.bottom(1)[0]["date_of_event"];
    var maxDate = dateDim.top(1)[0]["date_of_event"];

    //Charts
    var timeChart = dc.lineChart("#time-chart");
    var eventTypeChart = dc.rowChart("#event-type-row-chart");
    var numberBookingsND = dc.numberDisplay("#number-bookings-nd");
    var totalGuestsND = dc.numberDisplay("#total-guests-nd");
    var selectField = dc.selectMenu('#menu-select');


    selectField
        .dimension(regionDim)
        .group(regionGroup);

    numberBookingsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(numberOfBookings);

    totalGuestsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(all)
        .formatNumber(d3.format(".3s"));

    timeChart
        .ordinalColors(["#C96A23"])
        .width(1200)
        .height(300)
        .margins({top: 30, right: 50, bottom: 30, left: 50})
        .dimension(dateDim)
        .group(numBookingsByDate)
        .renderArea(true)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .xAxisLabel("Year")
        .yAxis().ticks(6);


    eventTypeChart
        .ordinalColors(["#79CED7", "#66AFB2", "#C96A23", "#D3D1C5", "#F5821F"])
        .width(300)
        .height(250)
        .dimension(eventTypeDim)
        .group(numBookingsByEventType)
        .xAxis().ticks(4);


    dc.renderAll();
}