Feature: OSCAL Document Constraints

Scenario: Validating an OSCAL document with metaschema constraints
  Given I have an OSCAL document "profile.json"
  And I have an Metaschema extensions document "oscal-external-constraints.xml"
  When I validate with imported validate function
  Then I should receive a validation object
  And the validation result should be valid

Scenario: Validating an OSCAL document with metaschema constraints
  Given I have an OSCAL document "ssp.xml"
  And I have an Metaschema extensions document "oscal-external-constraints.xml"
  And I have a second Metaschema extensions document "fedramp-external-constraints.xml"
  When I validate with imported validate function
  Then I should receive a validation object
  And the validation result should be valid

