class roomQueue {
  constructor() {
    this.rooms = [];
  }

  addPlayer(playerID) {

    if (this.rooms.length === 0 || this.allFull()) {
      this.newroom = {
        roomId: Math.floor(Math.random() * 10000),
        player1: '',
        player2: '',
        isFull: false
      };
      this.newroom.player1 = playerID;
      this.rooms.push(this.newroom)
    }
    else {
      this.newroom = this.rooms[this.rooms.length - 1];
      this.newroom.player2 = playerID;
      this.newroom.isFull = true;

    }
    return this.rooms[this.rooms.length -1].roomId;
  }
  removePlayer(roomIdx, playerID) {
    //var removeroom = this.rooms.filter(room => room.roomId === roomIdx);
    this.rooms.forEach((el) => {
      if (el.roomId === roomIdx)
        if (el.player1 === playerID)
          el.player1 = '';
        else {
          el.player2 = '';
          el.isFull = false;
        }
    });
  }

  removeRoom(roomId){
    //someArray.splice(x, 1);
    if (this.rooms.length != 0){
      var index = 0;
      this.rooms.forEach((el) => {
        if (el.roomId === roomId)
          index = this.rooms.indexOf(el);
      });
      if (index !=0)
      this.rooms.splice(index,1);
    }
  }

  allFull() {
    return this.rooms
      .map(room => room.isFull)
      .reduce((accum, next) => accum && next);
  }

  getrooms() {
    console.log('Camere existente:');
    this.rooms.forEach((el) => {
      console.log(el.roomId,
        el.player1, el.player2);
    });
  }

  getrooms2() {
    return this.rooms;
  }
}

module.exports = roomQueue;
var rq = new roomQueue;
console.log([true, false].reduce((a, b) => a && b));
rq.addPlayer('ti');
//rq.getrooms();
rq.addPlayer('a');
//rq.getrooms();
rq.addPlayer('b');
//rq.getrooms();
rq.addPlayer('c');
rq.addPlayer('t');
rq.addPlayer('m');
//rq.removeRoom(rq.rooms[1].roomId);
rq.removeRoom(4);
//rq.removePlayer(rq.rooms[0].roomId, 'a');
rq.getrooms();