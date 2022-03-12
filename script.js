// ==UserScript==
// @name         takemine script
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  some stuff for takemine.io
// @author       You
// @match        https://takemine.io/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=takemine.io
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    var local = {
        init: false,
        enemies: {
            list: [],
            nearestEnemy: null,
        },
        Math: {
            dist: function(a,b) {
                Math.sqrt(Math.pow((b.y - a.y), 2) + Math.pow((b.x - a.x), 2));
            }
        },
        WS: {
            SOCKET: null,
            SEND: WebSocket.prototype.send
        },
        myPlayer: {
            id: null,
            x: null,
            y: null,
            health: null,
            clan: null,
            name: null,
            dir: null
        },
        canvas: {
            gctx: CanvasRenderingContext2D.prototype.clearRect,
            ctx2d: null,
            raf: requestAnimationFrame
        }

    }
    class PacketManager {
        static handleServerPacket(data) {
            if (data[1]) {
                switch(data[0]) {
                    case 4:
                        if (typeof data[1][7] === 'string') {
                            local.enemies.list = [];
                            for (let i = 0; i < data[1].length / 11; i++) {
                                let player = data[1].slice(11 * i, 11 * i + 11);
                                if (player[0] == local.myPlayer.id) {
                                    local.myPlayer.dir = player[1];
                                    local.myPlayer.x = player[2];
                                    local.myPlayer.y = player[3];
                                    local.myPlayer.health = player[4];
                                    local.myPlayer.clan = player[7];
                                } else {
                                    local.enemies.list.push(player);
                                    if(local.enemies.list) {
                                        let dist = local.Math.dist;
                                        let myPlayer = local.myPlayer;
                                        local.enemies.nearestEnemy = local.enemies.list.sort((a,b) => (dist(a,myPlayer) - dist(b, myPlayer)))[0]
                                    }
                                }
                            }
                        }
                        break;
                    case 3:
                        local.myPlayer.id = data[1][0]
                        break;
                    case 13:
                        // leaderboard update
                        break;
                    default:
                        console.log(data)

                }
            }
        }
    }

    let parse = JSON.parse
    JSON.parse = function() {
        PacketManager.handleServerPacket(parse(arguments[0]))
        return parse(arguments[0])
    };
    WebSocket.prototype.send = function(){
        local.WS.SEND.call(this, arguments[0]);
        let data = parse(arguments[0].replaceAll(/42/g, ''))
        if(data[0] == 0) {
            local.myPlayer.name = data[1]
        }
        if(!local.init) {
            local.WS.SOCKET = this;
            local.init = true
        }
    }
})();
