import { getFirstTrueProperty } from './helpers'

describe('getFirstTrueProperty', () => {
  it('returns first property key where value is true', () => {
    expect(
      getFirstTrueProperty({
        'Something went wrong': false,
        'The DB is down': true
      })
    ).toEqual('The DB is down')

    expect(
      getFirstTrueProperty({
        'Something went wrong': true,
        'The DB is down': true
      })
    ).toEqual('Something went wrong')

    expect(
      getFirstTrueProperty({
        'Something went wrong': true,
        'The DB is down': false
      })
    ).toEqual('Something went wrong')
  })

  it('returns undefined when all values are false', () => {
    expect(
      getFirstTrueProperty({
        'Something went wrong': false,
        'The DB is down': false
      })
    ).toEqual(undefined)
  })
})
