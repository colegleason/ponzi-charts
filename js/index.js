var PONZI_ADDR = "1ponziUjuCVdB167ZmTWH48AURW1vE64q";
var CHANGE_ADDR = "14ji9KmegNHhTchf4ftkt3J1ywmijGjd6M";

var ponziData, changeData, txs;

function loadData(cb) {
    d3.json('data/ponzi.json', function(data) {
        d3.json('data/ponzi_change.json', function(change) {
            ponziData = data;
            changeData = change;
            txs = data.txs.concat(change.txs);
            var tx_hash = _.indexBy(txs, 'tx_index');
            txs = _.values(tx_hash);
            txs.sort(function(a, b) { return a.time - b.time;});
            txs.forEach(function(t) {
                t.total_input = t.inputs.reduce(function(sum, input) {
                    return sum + input.prev_out.value;
                }, 0);
                t.total_output = t.out.reduce(function(sum, output) {
                    return sum + output.value;
                }, 0);
                t.tx_fee = t.total_input = t.total_output;
            });
            if (cb) cb(txs);
        });
    });
}

function inOut(id, data) {
    data = data || txs;
    d3.select('#chart-description').text('Sum of incoming/outgoing transactions over time.');

    var incoming_txs = data.filter(function(t) {
        var out_addrs = _.pluck(t.out, 'addr');
        return _.contains(out_addrs, PONZI_ADDR);
    });

    var outgoing_txs = data.filter(function(t) {
        var input_addrs = _.pluck(_.pluck(t.inputs, 'prev_out'), 'addr');
        return _.contains(input_addrs, PONZI_ADDR) || _.contains(input_addrs, CHANGE_ADDR) ;
    });

    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Insert a new SVG element (our chart)
    var svg = d3.select(id + ' svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.time.scale.utc()
            .range([0, width]);

    var y = d3.scale.linear()
            .range([height, 0]);

    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

    var satoshiPerBTC =  100000000;
    var line = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) {
                return y(d.value_sum / satoshiPerBTC);
            });
    var inData = [];
    incoming_txs.forEach(function(tx) {
        var datum = {};
        datum.date = new Date(tx.time*1000);
        var to_ponzi = tx.out.reduce(function(sum, output) {
            var is_ponzi = (output.addr === PONZI_ADDR);
            return sum + (is_ponzi ? output.value : 0);
        }, 0);
        var last = _.last(inData);
        datum.value_sum = to_ponzi + (last ? last.value_sum : 0);
        inData.push(datum);
    });

    var outData = [];
    outgoing_txs.forEach(function(tx) {
        var datum = {};
        datum.date = new Date(tx.time*1000);
        var from_ponzi = tx.out.reduce(function(sum, output) {
            // if the out address is going to ponzi or change, ignore it
            var is_ponzi = output.addr == PONZI_ADDR || output.addr == CHANGE_ADDR;
            return sum + (is_ponzi ? 0 : output.value);
        }, 0);
        var last = _.last(outData);
        datum.value_sum = from_ponzi + (last ? last.value_sum : 0);
        outData.push(datum);
    });

    x.domain(d3.extent(outData.concat(inData), function(d) { return d.date; }));
    y.domain(d3.extent(outData.concat(inData), function(d) { return d.value_sum / satoshiPerBTC; }));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Amount (BTC)");

    svg.append("path")
        .datum(inData)
        .attr("class", "line_in")
        .attr("d", line);

    svg.append("path")
        .datum(outData)
        .attr("class", "line_out")
        .attr("d", line);
}
