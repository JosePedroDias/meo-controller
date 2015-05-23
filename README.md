# MEO-CONTROLLER

The MEO box has a telnet interface to receive remote control commands.  
This module exposes it in a friendly manner.

Kudos to the project [telnetit](https://github.com/sxyizhiren/telnetit).  
Using a refactored/simplified version of it.


## installing

    npm install meo-controller


## usage

exposes a function which accepts a callback with signature `cb(err, api)`.  
error is filled in case of error, api returned otherwise

public API follows:

```javascript
api.sendKey( {String} keyName )
```

```javascript
api.sendNumber( {Number} keyValue )
```

```javascript
api.close()
```


### Mapped keys so far:

0, 1, 2, 3, 4, 5, 6, 7, 8, 9, back, ok, p+, p-, menu, up, down, left, right, options, guia tv, videoclube, gravacoes, teletext, prev, rewind, play/pause, forward, next, stop, red, green, yellow, blue, switchscreen, i, mute, v-, v+, record, power
