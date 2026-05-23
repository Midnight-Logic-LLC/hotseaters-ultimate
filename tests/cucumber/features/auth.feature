@smoke @ui @auth
Feature: Authentication journeys
  HotSeatersMVP is the bible. Self-hosted Supabase only — never *.supabase.co.

  Background:
    Given the SPA is served at the configured base URL
    And the supabase auth endpoint is mocked

  Scenario: Sign in with Google
    Given I visit "/login"
    When I click the "Sign in with Google" button
    And the mocked Google OAuth callback returns a valid session for the Owner
    Then I am redirected to "/dashboard"
    And the dashboard greeting shows the Owner's name

  Scenario: Sign in with magic link
    Given I visit "/login"
    When I fill in the email field with "owner+e2e@hotseaters.test"
    And I click the "Magic Link" button
    Then I see the "Check your email" confirmation
    And the supabase OTP endpoint received the email "owner+e2e@hotseaters.test"

  Scenario: Accept an invitation
    Given an invitation token "inv-abc-123" exists for "invitee+e2e@hotseaters.test"
    When I visit "/invite/inv-abc-123"
    And I complete the invitation form
    Then I am redirected to "/onboarding/welcome"
    And a user_info row is created via the bridge trigger

  Scenario: Sub-user pending approval
    Given a sub-user "pending+e2e@hotseaters.test" has signed in but has no approved user_info
    When the sub-user visits "/dashboard"
    Then I am redirected to "/pending-approval"
    And I see the "Your account is awaiting Owner approval" message
