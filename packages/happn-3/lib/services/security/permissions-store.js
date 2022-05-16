module.exports = class PermissionsStore {
  constructor() {
    this.stored = {};
  }
  static create() {
    return new PermissionsStore();
  }
  get(permissionKey, userId) {
    return (this.stored[permissionKey] && this.stored[permissionKey][userId]) || null;
  }
  set(permissionKey, userId, data) {
    this.stored[permissionKey] = this.stored[permissionKey] || {};
    this.stored[permissionKey][userId] = data;
  }
  clear() {
    this.stored = {};
  }
};
