export namespace ChordParseMessages {
    export const Error_ChordNameUnexpectedText = "不能识别的和弦组成部分：'{0}";
    export const Error_ChordDim9NotSupported = "不存在dim9和弦，因为其中的减九度相当于纯八度。如果要在dim7的基础上叠加大九度，请使用dim7add9";
    export const Error_ChordDim11NotSupported = "不存在dim11和弦，因为其中的减九度相当于纯八度";
    export const Error_ChordDim13NotSupported = "不存在dim13和弦，因为其中的减九度相当于纯八度";
    export const Error_ChordMissingOrInvalidBassNote = "不能识别的和弦根音";
    export const Warning_AlreadyHaveMinorSecond = "和弦里已经包括了小二度音，这个变化音将被忽略";
    export const Warning_AlreadyHaveAugmentedSecond = "和弦里已经包括了增二度音，这个变化音将被忽略";
    export const Warning_AlreadyHaveMinorThird = "和弦里已经包括了小三度音，这个变化音将被忽略";
    export const Warning_AlreadyHaveAugmentedFourth = "和弦里已经包括了增四度音，这个变化音将被忽略";
    export const Warning_AlreadyHaveDiminishedFifth = "和弦里已经包括了减五度音，这个变化音将被忽略";
    export const Warning_AlreadyHaveAugmentedFifth = "和弦里已经包括了增五度音，这个变化音将被忽略";
    export const Warning_AlreadyHaveMinorSixth = "和弦里已经包括了小六度音，这个变化音将被忽略";
    export const Warning_AlreadyHaveMinorNinth = "和弦里已经包括了小九度音，这个变化音将被忽略";
    export const Warning_AlreadyHaveAugmentedNinth = "和弦里已经包括了增九度音，这个变化音将被忽略";
    export const Warning_AlreadyHaveAugmentedEleventh = "和弦里已经包括了增十一度音，这个变化音将被忽略";
    export const Warning_ChordSuspended2NotAvailable = "不应在此类和弦上使用挂留音，因为三度音被替换后将会消除它的原有属性";
    export const Warning_ChordSuspended4NotAvailable = "不应在此类和弦上使用挂留音，因为三度音被替换后将会消除它的原有属性";
    export const Warning_AlreadyHaveSecondWhileAddingTone = "和弦里已经包含了二度音，这个添加音将被忽略";
    export const Warning_AlreadyHaveFourthWhileAddingTone = "和弦里已经包含了四度音，这个添加音将被忽略";
    export const Warning_AlreadyHaveSixthWhileAddingTone = "和弦里已经包含了六度音，这个添加音将被忽略";
    export const Warning_AlreadyHaveNinthWhileAddingTone = "和弦里已经包含了九度音，这个添加音将被忽略";
    export const Warning_AlreadyHaveEleventhWhileAddingTone = "和弦里已经包含了十一度音，这个添加音将被忽略";
    export const Warning_AlreadyHaveThirteenthWhileAddingTone = "和弦里已经包含了十三度音，这个添加音将被忽略";
    export const Warning_AddNinthOnSeventhChord = "在七和弦上添加九度音是不规范的写法，应该直接使用变化音的写法";
    export const Warning_AddEleventhOnNinthChord = "在九和弦上添加十一度音是不规范的写法，应该直接使用变化音的写法";
    export const Warning_AddThirteenthOnEleventhChord = "在十一和弦上添加十三度音是不规范的写法，应该直接使用变化音的写法";
}