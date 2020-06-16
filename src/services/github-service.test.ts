import GithubService from './github-service'

describe('GithubService', () => {
  it('throw an error if accessToken is empty', () => {
    expect(() => {
      new GithubService('')
    }).toThrow('accessToken is empty :(')
  })
})
