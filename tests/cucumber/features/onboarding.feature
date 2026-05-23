@smoke @ui @onboarding
Feature: Owner onboarding
  HotSeatersMVP is the bible.

  Scenario: Owner completes onboarding
    Given I am signed in as a new Owner with an empty company
    When I visit "/onboarding/welcome"
    And I fill in the company name with "Acme Trial Services"
    And I select the time zone "America/Los_Angeles"
    And I pick the default trial-services pricing template
    And I click "Finish setup"
    Then I am redirected to "/dashboard"
    And the company "Acme Trial Services" exists in the entity graph
    And my user_info.onboarding_completed_at is set
