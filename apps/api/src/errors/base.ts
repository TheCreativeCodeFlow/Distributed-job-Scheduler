export abstract class BaseError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly title: string;
  public readonly type: string;
  public readonly detail: string;
  public readonly instance?: string | undefined;

  constructor(detail: string, type?: string, instance?: string | undefined) {
    super(detail);
    this.detail = detail;
    this.type = type || 'about:blank';
    this.instance = instance;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toResponse(instancePath?: string): {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance: string;
    invalidParams?: Array<{ name: string; reason: string }>;
  } {
    const res: {
      type: string;
      title: string;
      status: number;
      detail: string;
      instance: string;
      invalidParams?: Array<{ name: string; reason: string }>;
    } = {
      type: this.type,
      title: this.title,
      status: this.statusCode,
      detail: this.detail,
      instance: this.instance || instancePath || 'about:blank',
    };
    return res;
  }
}
