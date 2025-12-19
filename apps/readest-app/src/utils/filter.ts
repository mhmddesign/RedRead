import { Book } from '@/types/book';
import { FilterRule, SmartCollection } from '@/store/libraryStore';

export const OPERATORS = {
  equals: 'Equals',
  contains: 'Contains',
  greaterThan: 'Greater than',
  lessThan: 'Less than',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
} as const;

export const FIELDS = {
  title: 'Title',
  author: 'Author',
  tag: 'Tag',
  subject: 'Subject',
  series: 'Series',
  publisher: 'Publisher',
  language: 'Language',
  pageCount: 'Page Count',
  rating: 'Rating',
  dateAdded: 'Date Added',
  datePublished: 'Date Published',
} as const;

const compareValues = (
  fieldValue: string | number | boolean | undefined | null,
  ruleValue: string | number | boolean,
  operator: FilterRule['operator'],
): boolean => {
  if (fieldValue === undefined || fieldValue === null) return false;

  const fVal = String(fieldValue).toLowerCase();
  const rVal = String(ruleValue).toLowerCase();
  const fNum = Number(fieldValue);
  const rNum = Number(ruleValue);
  const isNum = !isNaN(fNum) && !isNaN(rNum) && typeof ruleValue === 'number';

  switch (operator) {
    case 'equals':
      return isNum ? fNum === rNum : fVal === rVal;
    case 'contains':
      return fVal.includes(rVal);
    case 'startsWith':
      return fVal.startsWith(rVal);
    case 'endsWith':
      return fVal.endsWith(rVal);
    case 'greaterThan':
      return isNum ? fNum > rNum : fVal > rVal;
    case 'lessThan':
      return isNum ? fNum < rNum : fVal < rVal;
    default:
      return false;
  }
};

export const checkRule = (book: Book, rule: FilterRule): boolean => {
  switch (rule.field) {
    case 'title':
      return compareValues(book.title, rule.value, rule.operator);
    case 'author':
      return compareValues(book.author, rule.value, rule.operator); // Author is usually string
    case 'tag':
      return (book.tags || []).some((tag) => compareValues(tag, rule.value, rule.operator));
    case 'subject':
      return (book.subjects || []).some((subject) =>
        compareValues(subject, rule.value, rule.operator),
      );
    case 'series':
      return compareValues(book.series, rule.value, rule.operator);
    case 'publisher':
      return compareValues(book.publisher, rule.value, rule.operator);
    case 'language':
      return compareValues(book.primaryLanguage, rule.value, rule.operator);
    case 'pageCount':
      return compareValues(book.pageCount, rule.value, rule.operator);
    case 'rating':
      return compareValues(book.rating, rule.value, rule.operator);
    case 'dateAdded':
      // For simplicity, value should be timestamp or date string
      return compareValues(book.createdAt, rule.value, rule.operator);
    case 'datePublished':
      // Needs better parsing usually, but basic support:
      return compareValues(book.publishedDate, rule.value, rule.operator);
    default:
      return false;
  }
};

export const filterBooksByCollection = (books: Book[], collection: SmartCollection): Book[] => {
  if (!collection.rules || collection.rules.length === 0) return books;

  return books.filter((book) => {
    if (collection.matchAll) {
      // AND logic
      return collection.rules.every((rule) => checkRule(book, rule));
    } else {
      // OR logic
      return collection.rules.some((rule) => checkRule(book, rule));
    }
  });
};
