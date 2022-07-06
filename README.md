# Setup 

```
% node -v
v16.15.1
% npm -v
8.11.0
% npm install
% node app.js
running on port 8080
```

# API usage

```
% curl -s 'http://localhost:8080/' | jq ''
{
  "begin": "2022-07-06T16:53:02.312Z",
  "current": "2022-07-06T16:53:35.827Z",
  "running": "0.0003 days",
  "cache": {
    "status": {
      "hits": 0,
      "misses": 0,
      "keys": 0,
      "ksize": 0,
      "vsize": 0
    },
    "keys": []
  }
}
```

```
% curl -s 'http://localhost:8080/eval?debug=1&js[]=https://code.jquery.com/jquery-3.6.0.slim.min.js' | jq ''
{
  "status": true,
  "input": [
    "https://code.jquery.com/jquery-3.6.0.slim.min.js"
  ],
  "output": [
    "done"
  ],
  "error": [
    null
  ]
}
```

```
% curl -s 'http://localhost:8080/' | jq ''
{
  "begin": "2022-07-06T16:53:02.312Z",
  "current": "2022-07-06T16:54:18.383Z",
  "running": "0.0008 days",
  "cache": {
    "status": {
      "hits": 0,
      "misses": 1,
      "keys": 1,
      "ksize": 48,
      "vsize": 72372
    },
    "keys": [
      "https://code.jquery.com/jquery-3.6.0.slim.min.js"
    ]
  }
}
```
