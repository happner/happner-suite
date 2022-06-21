// const GetSeq = require('./getSeqClass');
// module.exports = new GetSeq(0);
module.exports = {
  seq: 0,
//   last: 0,
  getFirst: () => {
    this.seq = 0;
    return [0, 0];
  },
  getNext: () => {
    return [0, ++this.seq];
  },
  getMeshName: (num) => {
    return 'MESH_' + (num - 1).toString();
  },
  getLast: () => {
    // this.last = ++this.seq;
    return [0, ++this.seq];
  }

};
