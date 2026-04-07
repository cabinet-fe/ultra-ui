//#region src/web-api/clipboard.d.ts
/** 剪切板 */
declare const clipboard: {
  /**
   * 将一段文本写入系统剪切板
   * @param data 写入的数据
   */
  copy(data: string | Blob | Array<string | Blob>): Promise<void>;
  /**
   * 从剪切板中读取纯文本数据
   * @returns 读取到的文本数据
   */
  read(): Promise<Blob[]>;
  /**
   * 读取文本内容
   * @returns 剪切板中的文本内容
   */
  readText(): Promise<string>;
};
//#endregion
export { clipboard };
//# sourceMappingURL=clipboard.d.ts.map