@smoke @ui @rbac
Feature: Role × route access matrix
  Mirrors the legacy HotSeatersMVP role-route matrix (§0.9 of the plan).
  Self-hosted Supabase only.

  Scenario Outline: Role <role> visiting <route> should <expectation>
    Given I am signed in as a "<role>"
    When I visit "<route>"
    Then the route should "<expectation>"

    Examples:
      | role             | route               | expectation     |
      | owner            | /dashboard          | render          |
      | owner            | /Clients            | render          |
      | owner            | /Trials             | render          |
      | owner            | /settings/billing   | render          |
      | owner            | /settings/team      | render          |
      | admin            | /dashboard          | render          |
      | admin            | /Clients            | render          |
      | admin            | /Trials             | render          |
      | admin            | /settings/billing   | render          |
      | admin            | /settings/team      | render          |
      | sales            | /dashboard          | render          |
      | sales            | /Clients            | render          |
      | sales            | /Trials             | render          |
      | sales            | /settings/billing   | redirect        |
      | sales            | /settings/team      | redirect        |
      | trial_consultant | /dashboard          | render          |
      | trial_consultant | /Clients            | redirect        |
      | trial_consultant | /Trials             | render-readonly |
      | trial_consultant | /settings/billing   | redirect        |
      | trial_consultant | /settings/team      | redirect        |
