set -e

BASE_DIR="$(dirname "$0")";
GENFILE="$BASE_DIR/../solvers/letters/generated-data.js";
GENBIN="$BASE_DIR/word-loader.js";

function download_words() {
	URL="$1";
	FILE="$2";
	if [[ ! -f "$FILE" ]]; then
		mkdir -p temp;
		curl "$URL" > temp/wb.deb;
		cd temp;
		ar -x wb.deb;
		tar -xvf data.tar.*;
		cd -;
		grep -x '[a-z]*' "temp/usr/share/dict"/* | sort > "$FILE";
		rm -rf temp;
	fi;
}

# https://packages.debian.org/sid/wbritish-small
download_words \
	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish-small_2018.04.16-1_all.deb" \
	"british-english-small";

# https://packages.debian.org/sid/wbritish
download_words \
	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish_2018.04.16-1_all.deb" \
	"british-english";

# https://packages.debian.org/sid/wbritish-large
download_words \
	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish-large_2018.04.16-1_all.deb" \
	"british-english-large";

# https://packages.debian.org/sid/wbritish-huge
download_words \
	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish-huge_2018.04.16-1_all.deb" \
	"british-english-huge";

# https://packages.debian.org/sid/wbritish-insane
download_words \
	"http://ftp.uk.debian.org/debian/pool/main/s/scowl/wbritish-insane_2018.04.16-1_all.deb" \
	"british-english-insane";


echo '// generated file' > "$GENFILE";
echo >> "$GENFILE";

cat british-english-small | node "$BASE_DIR/word-loader.js" "wordsSmall" >> "$GENFILE";
comm -23 british-english british-english-small | node "$GENBIN" "wordsNormal" >> "$GENFILE";
comm -23 british-english-large british-english | node "$GENBIN" "wordsLarge" >> "$GENFILE";
comm -23 british-english-huge british-english-large | node "$GENBIN" "wordsHuge" >> "$GENFILE";
comm -23 british-english-insane british-english-huge | node "$GENBIN" "wordsInsane" >> "$GENFILE";

echo >> "$GENFILE";
cat <<EOF >> "$GENFILE";
const words = [
	...wordsSmall.map((word) => ({ word, freq: 4 })),
	...wordsNormal.map((word) => ({ word, freq: 3 })),
	...wordsLarge.map((word) => ({ word, freq: 2 })),
	...wordsHuge.map((word) => ({ word, freq: 1 })),
	...wordsInsane.map((word) => ({ word, freq: 0 })),
];
EOF
