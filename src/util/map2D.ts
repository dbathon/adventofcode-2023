import { Node } from "./graphUtil";

export class Map2DNode<T> implements Node {
  constructor(
    readonly map: Map2D<T>,
    readonly x: number,
    readonly y: number
  ) {}

  get value(): T | undefined {
    return this.map.get(this.x, this.y);
  }
  set value(value: T | undefined) {
    this.map.set(this.x, this.y, value);
  }

  get nodeKey() {
    return this.x + ";" + this.y;
  }

  get up() {
    return new Map2DNode<T>(this.map, this.x, this.y - 1);
  }
  get down() {
    return new Map2DNode<T>(this.map, this.x, this.y + 1);
  }
  get left() {
    return new Map2DNode<T>(this.map, this.x - 1, this.y);
  }
  get right() {
    return new Map2DNode<T>(this.map, this.x + 1, this.y);
  }

  get fourNeighbors() {
    return [this.up, this.right, this.down, this.left];
  }

  get eightNeighbors() {
    const up = this.up;
    const down = this.down;
    return [up.left, up, up.right, this.left, this.right, down.left, down, down.right];
  }
}

/**
 * A 2D map of T elements around (0,0). It grows as needed in all directions (but is not sparse).
 */
export class Map2D<T> {
  private data: (T | undefined)[] = [];
  // internalDim is always greater or equal to seenWidth and seenHeight
  private internalDim = 1;
  private writtenWidth = 0;
  private writtenHeight = 0;
  originX = 0;
  originY = 0;

  copy(): Map2D<T> {
    const result: Map2D<T> = new Map2D();
    result.data = this.data.slice(0);
    result.internalDim = this.internalDim;
    result.writtenWidth = this.writtenWidth;
    result.writtenHeight = this.writtenHeight;
    result.originX = this.originX;
    result.originY = this.originY;
    return result;
  }

  get width(): number {
    return this.writtenWidth;
  }

  get height(): number {
    return this.writtenHeight;
  }

  private getIndex(x: number, y: number, grow = false): number | undefined {
    const xIndex = x - this.originX;
    const yIndex = y - this.originY;
    if (xIndex < 0 || xIndex >= this.internalDim || yIndex < 0 || yIndex >= this.internalDim) {
      if (!grow) {
        return undefined;
      }
      // we need to grow
      const oldMap: Map2D<T> = this.copy();

      this.data.length = 0;
      if (xIndex < 0) {
        this.originX = x;
      }
      if (yIndex < 0) {
        this.originY = y;
      }
      const maxIndex = Math.max(xIndex, yIndex);
      if (maxIndex >= this.internalDim) {
        this.internalDim = maxIndex * 2;
      }

      // now just copy the data from oldMap
      oldMap.forEach((x, y, value) => {
        this.set(x, y, value);
      });

      return this.getIndex(x, y);
    }
    if (xIndex + 1 > this.writtenWidth) {
      this.writtenWidth = xIndex + 1;
    }
    if (yIndex + 1 > this.writtenHeight) {
      this.writtenHeight = yIndex + 1;
    }
    return yIndex * this.internalDim + xIndex;
  }

  get(x: number, y: number): T | undefined {
    const index = this.getIndex(x, y);
    return index === undefined ? undefined : this.data[index];
  }

  set(x: number, y: number, value: T | undefined): void {
    if (value !== undefined || this.get(x, y) !== undefined) {
      this.data[this.getIndex(x, y, true)!] = value;
    }
  }

  getNode(x: number, y: number): Map2DNode<T> {
    return new Map2DNode<T>(this, x, y);
  }

  forEach(callback: (x: number, y: number, value: T | undefined) => any) {
    const width = this.width;
    const height = this.height;
    const originX = this.originX;
    const originY = this.originY;
    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        const realX = originX + x;
        const realY = originY + y;
        callback(realX, realY, this.get(realX, realY));
      }
    }
  }

  forEachNode(callback: (node: Map2DNode<T>) => any) {
    this.forEach((x, y) => callback(this.getNode(x, y)));
  }

  getNodes(): Map2DNode<T>[] {
    const result: Map2DNode<T>[] = [];
    this.forEach((x, y) => result.push(this.getNode(x, y)));
    return result;
  }

  getAsArray(): (T | undefined)[][] {
    const width = this.width;
    const height = this.height;
    const result: (T | undefined)[][] = [];
    for (let y = 0; y < height; ++y) {
      const row: (T | undefined)[] = [];
      result.push(row);
      for (let x = 0; x < width; ++x) {
        row[x] = this.get(this.originX + x, this.originY + y);
      }
    }
    return result;
  }

  /**
   * This only works if all the elements are single character strings.
   */
  draw(toStr: (t: T) => unknown = (t) => t): string {
    return this.getAsArray()
      .map((row) =>
        row
          .map((element) => {
            return element === undefined ? " " : toStr(element);
          })
          .join("")
      )
      .join("\n");
  }
}
