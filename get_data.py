import requests, json

PONZI_ADDR = "14ji9KmegNHhTchf4ftkt3J1ywmijGjd6M"
LIMIT = 50

url = "https://blockchain.info/address/{0}?format=json&limit={1}&offset={2}".format(PONZI_ADDR, LIMIT, 0)
r = requests.get(url)
data = r.json()

offset = len(data['txs'])
while offset < data['n_tx']:
    print "grabbing {0}-{1} of {2}".format(offset, offset + LIMIT, data['n_tx'])
    url = "https://blockchain.info/address/{0}?format=json&limit={1}&offset={2}".format(PONZI_ADDR, LIMIT, offset)
    r = requests.get(url)
    txs = r.json()['txs']
    data['txs'].extend(txs)
    offset = len(data['txs'])

with open('data/ponzi_change.json', 'w') as outfile:
    outfile.write(json.dumps(data, indent=4))
