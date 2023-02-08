use v5.21;
use JSON;
use UUID qw(uuid);

use base 'Exporter'; our @EXPORT = our @EXPORT_OK = qw(log_event);

sub log_event {
  state $uuid ||= uuid();
  my (%details) = ("event", @_, uuid => $uuid);
  print STDERR JSON::encode_json(\%details) . "\n";
}
