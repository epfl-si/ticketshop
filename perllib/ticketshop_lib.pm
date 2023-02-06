use JSON;
use v5.21;

use base 'Exporter'; our @EXPORT = our @EXPORT_OK = qw(log_event);

sub log_event {
  my (%details) = ("event", @_);
  print STDERR JSON::encode_json(\%details) . "\n";
}
