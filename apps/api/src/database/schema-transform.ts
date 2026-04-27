interface SerializedDocumentFields {
  _id?: { toString(): string };
  id?: string;
  __v?: number;
}

type SerializedDocument<TDocument extends object> = Omit<
  TDocument,
  keyof SerializedDocumentFields
> &
  SerializedDocumentFields;

export function transformDocumentId<TDocument extends object>(
  _document: object,
  ret: SerializedDocument<TDocument>,
) {
  if (ret._id) {
    ret.id = ret._id.toString();
  }
  delete ret._id;
  delete ret.__v;
  return ret;
}
