const { username, password } = require('../../credentials.json');

describe('urls', function () {
  const podcastId = '144988';
  const podcastSeason = '2016';

  const PODCAST_URL = `https://app.stitcher.com/browse/feed/${podcastId}/episodes`;

  const episodeUrls = [];

  it('should grab all .mp3 urls', () => {
    cy.visit('https://www.stitcher.com');
    cy.get('[rel="login"]').click();
    cy.get('#loginModal')
      .should('be.visible');
    cy.get('#loginModal [name="email"]')
      .type(username, { delay: 100 });
    cy.get('#loginModal [name="password"]')
      .type(password, { delay: 100 });
    cy.get('#loginModal [rel="submit"]').click();
    cy.wait(1000);
    cy.get('#header_nav .registered')
      .should('be.visible');

    cy.visit(PODCAST_URL);
    cy.get('#feed-seasons').click();
    cy.get('.feed-seasons-list-wrapper').contains('2014').click();

    cy.get('.episode-detail-item .list-item-play').each(($playButton, index) => {
      cy.wrap($playButton).click({ multiple: true });
      cy.wait(1000);
      const src = cy.get('audio#jp_audio_0').invoke('attr', 'src').then((src) => {
        episodeUrls.push(src);
        cy.wait(1000);
      })
    });
  });

  afterEach(() => {
    if (episodeUrls.length) {
      cy.writeFile(`./${podcastId}-episodes-${podcastSeason}.json`, episodeUrls)
    }
  });
});
