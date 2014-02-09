var PONZI_ADDR = "1ponziUjuCVdB167ZmTWH48AURW1vE64q";
var CHANGE_ADDR = "14ji9KmegNHhTchf4ftkt3J1ywmijGjd6M";

function main() {
    d3.json('data/ponzi.json', function(data) {
        d3.json('data/ponzi.json', function(data_change) {
            incoming("#main", data, data_change);
        });
    });
}

function incoming(id, data, data_change) {
    var txs = data.txs.concat(data_change.txs);
    var tx_hash = _.indexBy(txs, 'tx_index');
    txs = _.values(tx_hash);
    txs.sort(function(a, b) { return a.time - b.time;});

    var incoming_txs = txs.filter(function(t) {
        var out_addrs = _.pluck(t.out, 'addr');
        return _.contains(out_addrs, PONZI_ADDR);
    });

    var outgoing_txs = txs.filter(function(t) {
        var input_addrs = _.pluck(_.pluck(t.inputs, 'prev_out'), 'addr');
        return _.contains(input_addrs, PONZI_ADDR) || _.contains(input_addrs, CHANGE_ADDR);
    });

    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Insert a new SVG element (our chart)
    var svg = d3.select(id).append("svg")
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

    var line = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) {
                return y(d.value_sum);
            });

    var satoshiPerBTC =  100000000;
    incoming_txs.forEach(function(d, i, array) {
        d.date = new Date(d.time*1000);
        var out_sum = d.out.reduce(function(sum, out) {
            // if the out address is ponzi, count it
            var is_ponzi = out.addr == PONZI_ADDR;
            return sum + (is_ponzi ? out.value : 0);
        }, 0) / satoshiPerBTC;
        d.value_sum = i == 0? out_sum : array[i - 1].value_sum + out_sum;
    });

    outgoing_txs.forEach(function(d, i, array) {
        d.date = new Date(d.time*1000);
        var out_sum = d.out.reduce(function(sum, out) {
            // if the out address is going to ponzi or change, ignore it
            var is_ponzi = out.addr == PONZI_ADDR || out.addr == CHANGE_ADDR;
            return sum + (is_ponzi ? 0 : out.value);
        }, 0) / satoshiPerBTC;
        d.value_sum = i == 0? out_sum : array[i - 1].value_sum + out_sum;
    });

    console.log(incoming_txs[incoming_txs.length - 1].value_sum);
    console.log(outgoing_txs[outgoing_txs.length - 1].value_sum);

  x.domain(d3.extent(incoming_txs.concat(outgoing_txs), function(d) { return d.date; }));
  y.domain(d3.extent(incoming_txs.concat(outgoing_txs), function(d) { return d.value_sum; }));

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
        .datum(incoming_txs)
        .attr("class", "line_in")
        .attr("d", line);

    svg.append("path")
        .datum(outgoing_txs)
        .attr("class", "line_out")
        .attr("d", line);
}
