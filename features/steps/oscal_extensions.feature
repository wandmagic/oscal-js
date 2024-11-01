Feature: OSCAL Document Constraints

@constraints
Scenario: Validating an OSCAL document with metaschema constraints
  Given I have an OSCAL document "ssp.xml"
  And I have an Metaschema extensions document "oscal-external-constraints.xml"
  When I validate with imported validateDocument function
  Then I should receive a validation object
  And the validation result should be valid


@constraints
Scenario: Validating an OSCAL document with metaschema constraints
  Given I have an OSCAL document "ssp.xml"
  And I have an Metaschema extensions document "oscal-external-constraints.xml"
  And I have a second Metaschema extensions document "fedramp-external-constraints.xml"
  When I validate with imported validateDocument function
  Then I should receive a validation object
  And the validation result should be valid
