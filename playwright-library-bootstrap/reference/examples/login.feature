Feature: User Login
  As a user
  I want to log in to my account
  So that I can access protected features

  Scenario: View login page
    Given I am on the home page
    When  I click the login link
    Then  I should see the login form

  Scenario: Successful login
    Given I am on the login page
    When  I enter valid credentials
    And   I click the login button
    Then  I should be redirected to the dashboard
    And   I should see my username in the header

  Scenario: Failed login with invalid credentials
    Given I am on the login page
    When  I enter invalid credentials
    And   I click the login button
    Then  I should see an error message
    And   I should remain on the login page

  Scenario: Logout
    Given I am logged in
    When  I click the logout button
    Then  I should be redirected to the home page
    And   I should no longer see my username
