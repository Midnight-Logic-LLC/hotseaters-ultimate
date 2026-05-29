import { describe, it, expect } from 'vitest';
import { guessContactEmail } from '../guess-contact-email';

describe('guessContactEmail', () => {
  it('returns null without first or last name', () => {
    expect(guessContactEmail('', 'Smith', [{ first_name: 'a', last_name: 'b', email: 'a.b@x.com' }])).toBeNull();
    expect(guessContactEmail('John', '', [{ first_name: 'a', last_name: 'b', email: 'a.b@x.com' }])).toBeNull();
  });

  it('returns null when no firm contacts have emails', () => {
    expect(guessContactEmail('John', 'Smith', [{ first_name: 'a', last_name: 'b', email: null }])).toBeNull();
  });

  it('detects first.last pattern', () => {
    const firm = [{ first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@firm.com' }];
    expect(guessContactEmail('John', 'Smith', firm)).toBe('john.smith@firm.com');
  });

  it('detects firstlast pattern', () => {
    const firm = [{ first_name: 'Jane', last_name: 'Doe', email: 'janedoe@firm.com' }];
    expect(guessContactEmail('John', 'Smith', firm)).toBe('johnsmith@firm.com');
  });

  it('detects firstinitial+last pattern', () => {
    const firm = [{ first_name: 'Jane', last_name: 'Doe', email: 'jdoe@firm.com' }];
    expect(guessContactEmail('John', 'Smith', firm)).toBe('jsmith@firm.com');
  });

  it('picks the most common domain', () => {
    const firm = [
      { first_name: 'Jane', last_name: 'Doe', email: 'jane.doe@main.com' },
      { first_name: 'Bob', last_name: 'Roe', email: 'bob.roe@main.com' },
      { first_name: 'Al', last_name: 'Poe', email: 'al.poe@other.com' },
    ];
    expect(guessContactEmail('John', 'Smith', firm)).toBe('john.smith@main.com');
  });

  it('falls back to firstinitial+last for an unrecognized pattern', () => {
    const firm = [{ first_name: 'Jane', last_name: 'Doe', email: 'xyz123@firm.com' }];
    expect(guessContactEmail('John', 'Smith', firm)).toBe('jsmith@firm.com');
  });
});
