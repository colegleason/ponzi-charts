import requests, json

PONZI_ADDR = "1ponziUjuCVdB167ZmTWH48AURW1vE64q"
CHANGE_ADDR = "14ji9KmegNHhTchf4ftkt3J1ywmijGjd6M"
LIMIT = 50

def download_addr_data(addr, filename):
    url = "https://blockchain.info/address/{0}?format=json&limit={1}&offset={2}".format(addr, LIMIT, 0)
    r = requests.get(url)
    data = r.json()
    offset = len(data['txs'])
    while offset < data['n_tx']:
        print "grabbing {0}-{1} of {2} for {3}".format(offset, offset + LIMIT, data['n_tx'], addr)
        url = "https://blockchain.info/address/{0}?format=json&limit={1}&offset={2}".format(addr, LIMIT, offset)
        r = requests.get(url)
        txs = r.json()['txs']
        data['txs'].extend(txs)
        offset = len(data['txs'])
    with open(filename, 'w') as outfile:
        outfile.write(json.dumps(data, indent=4))

download_addr_data(PONZI_ADDR, 'data/ponzi.json')
download_addr_data(CHANGE_ADDR, 'data/ponzi_change.json')
